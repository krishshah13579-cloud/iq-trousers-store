import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPayUConfig, verifyPayUResponseHash } from "@/lib/payu";
import { sendOrderConfirmationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    const body: Record<string, string> = {};

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const rawText = await req.text();
      const params = new URLSearchParams(rawText);
      params.forEach((value, key) => {
        body[key] = value;
      });
    } else if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      formData.forEach((value, key) => {
        body[key] = typeof value === "string" ? value : "";
      });
    } else {
      try {
        const json = await req.json();
        Object.assign(body, json);
      } catch {
        const rawText = await req.text();
        const params = new URLSearchParams(rawText);
        params.forEach((value, key) => {
          body[key] = value;
        });
      }
    }

    const {
      status = "",
      txnid = "",
      amount = "",
      mihpayid = "",
      error_Message = "",
      udf1: orderId = "",
    } = body;

    const baseUrl = process.env.NEXTAUTH_URL || "https://iqtrousers.com";
    const config = getPayUConfig();

    // Verify hash integrity if configured with merchant keys
    let isValidHash = true;
    if (config.isConfigured) {
      isValidHash = verifyPayUResponseHash(body, config.salt);
      if (!isValidHash) {
        console.error("[PAYU RESPONSE] Hash verification mismatch!", body);
      }
    }

    if (!orderId) {
      console.error("[PAYU RESPONSE] Missing order ID in callback", body);
      return NextResponse.redirect(new URL("/checkout?error=Payment+verification+failed", req.url), 303);
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.redirect(new URL("/checkout?error=Order+not+found", req.url), 303);
    }

    const isSuccess =
      isValidHash &&
      (status.toLowerCase() === "success" || status.toLowerCase() === "captured");

    if (isSuccess) {
      // 1. Mark order as CONFIRMED with payment reference
      const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "CONFIRMED",
          paymentIntent: mihpayid || txnid || "PAYU_SUCCESS",
        },
      });

      // 2. Automatically delete the used coupon from the coupons page / database
      if (order.discountCode) {
        try {
          await prisma.discount.deleteMany({
            where: { code: order.discountCode },
          });
          console.log(`[PAYU SUCCESS] Automatically deleted used coupon "${order.discountCode}" from the coupons page.`);
        } catch (couponDelErr) {
          console.error(`[PAYU SUCCESS] Failed to auto-delete coupon "${order.discountCode}":`, couponDelErr);
        }
      }

      // 3. Dispatch confirmation email (awaited to guarantee SMTP transmission)
      try {
        let parsedAddress = {
          fullName: "",
          address: "",
          city: "",
          state: "",
          zipCode: "",
          country: "",
          phone: "",
          email: "",
        };
        try {
          parsedAddress = JSON.parse(order.shippingAddress);
        } catch {}

        const recipientEmail = order.user?.email || body.email || parsedAddress.email;
        if (recipientEmail) {
          console.log(`[PAYU CALLBACK] Dispatching confirmation email to ${recipientEmail} for Order #${order.id}...`);
          const emailResult = await sendOrderConfirmationEmail({
            to: recipientEmail,
            orderId: order.id,
            customerName: order.user?.name || parsedAddress.fullName || "Valued Customer",
            items: order.items.map((i) => ({
              name: i.product.name,
              quantity: i.quantity,
              price: i.price,
              size: i.size,
            })),
            subtotal: order.items.reduce((sum, i) => sum + i.price * i.quantity, 0),
            discountAmount: order.discountAmount,
            discountCode: order.discountCode,
            shipping: 0,
            tax: 0,
            total: order.total,
            shippingAddress: parsedAddress,
            orderDate: order.createdAt,
          });
          console.log(`[PAYU CALLBACK] Order confirmation email delivery result:`, emailResult);
        } else {
          console.warn(`[PAYU CALLBACK] No recipient email found for Order #${order.id}`);
        }
      } catch (emailErr) {
        console.error("[PAYU EMAIL DISPATCH ERROR]", emailErr);
      }

      // Redirect to Order Details with success banner (relative path retains exact browser origin)
      const redirectUrl = `/orders/${order.id}?payment=success&payu_txnid=${encodeURIComponent(
        txnid || mihpayid
      )}`;

      // Return HTML with auto-submit / redirect to guarantee clean transition
      return new NextResponse(
        `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Payment Successful — IQ Trousers</title>
  <meta http-equiv="refresh" content="0;url=${redirectUrl}">
  <style>
    body { font-family: -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #fafafa; }
    .card { background: white; padding: 32px; border-radius: 16px; border: 1px solid #e5e7eb; text-align: center; max-width: 400px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .spinner { width: 36px; height: 36px; border: 3px solid #f3f4f6; border-top-color: #10b981; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 16px; }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="card">
    <div class="spinner"></div>
    <h3 style="margin:0 0 8px; font-size:18px; color:#111827;">Payment Successful</h3>
    <p style="margin:0; font-size:13px; color:#6b7280;">Redirecting to your order confirmation...</p>
    <script>window.location.href = "${redirectUrl}";</script>
  </div>
</body>
</html>`,
        {
          headers: { "Content-Type": "text/html" },
        }
      );
    } else {
      // Payment Failed or was Cancelled:
      // 1. Restock products
      // 2. Restore coupon if used
      // 3. Mark order as CANCELLED
      await prisma.$transaction(async (tx) => {
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                increment: item.quantity,
              },
            },
          });
        }

        if (order.discountCode) {
          const discount = await tx.discount.findUnique({
            where: { code: order.discountCode },
          });
          if (discount) {
            await tx.discount.update({
              where: { id: discount.id },
              data: {
                usedCount: {
                  decrement: 1,
                },
                active: true,
              },
            });
          }
        }

        await tx.order.update({
          where: { id: order.id },
          data: {
            status: "CANCELLED",
            paymentIntent: txnid ? `PAYU_FAILED_${txnid}` : "PAYU_FAILED",
          },
        });
      });

      const failureReason = error_Message || (!isValidHash ? "Payment verification failed" : "Payment was cancelled or unsuccessful");
      const redirectUrl = `/orders/${order.id}?payment=failed&reason=${encodeURIComponent(
        failureReason
      )}`;

      return new NextResponse(
        `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Payment Cancelled — IQ Trousers</title>
  <meta http-equiv="refresh" content="0;url=${redirectUrl}">
  <style>
    body { font-family: -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #fafafa; }
    .card { background: white; padding: 32px; border-radius: 16px; border: 1px solid #e5e7eb; text-align: center; max-width: 400px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
  </style>
</head>
<body>
  <div class="card">
    <h3 style="margin:0 0 8px; font-size:18px; color:#dc2626;">Payment Failed or Cancelled</h3>
    <p style="margin:0; font-size:13px; color:#6b7280;">Returning you to order details. Your items have been restocked.</p>
    <script>window.location.href = "${redirectUrl}";</script>
  </div>
</body>
</html>`,
        {
          headers: { "Content-Type": "text/html" },
        }
      );
    }
  } catch (error) {
    console.error("PayU response callback error:", error);
    return NextResponse.redirect(new URL("/checkout?error=Unexpected+payment+error", req.url), 303);
  }
}
