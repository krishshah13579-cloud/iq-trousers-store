"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Sparkles,
  ShieldCheck,
  Feather,
  Layers,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

const features = [
  {
    id: "waistband",
    number: "01",
    title: "Concealed 2-Inch Adaptive Flex Waistband",
    tagline: "Dynamic expansion when sitting or dining",
    description:
      "Engineered with hidden internal elastane tension bands that expand up to 2 inches when you sit or travel, then effortlessly retract without bunching. Your shirt stays neatly tucked all day.",
    icon: Sparkles,
    highlight: "Zero waist pinch points",
  },
  {
    id: "fabric",
    number: "02",
    title: "High-Twist Anti-Wrinkle Fabric Memory",
    tagline: "Sharp permanent press from 9 AM to late flights",
    description:
      "Crafted from high-twist combed cottons and fine worsted wool-feel blends. The nano-structured weave sheds travel wrinkles naturally and locks in a razor-sharp center crease through every wash.",
    icon: Feather,
    highlight: "Wrinkle-recovery weave",
  },
  {
    id: "pockets",
    number: "03",
    title: "Ergonomic 45° Anti-Drop Pockets",
    tagline: "Deep reinforced bags that never sag or spill",
    description:
      "Cut at a precise 45-degree angle with heavy-duty pocket bags. Your phone, wallet, and keys sit flush along your outer thigh, preventing unsightly bulging and accidental drops in low car seats.",
    icon: Layers,
    highlight: "Flush smartphone silhouette",
  },
  {
    id: "hardware",
    number: "04",
    title: "Reinforced Lockstitch & YKK Hardware",
    tagline: "Built for years of high-frequency wear",
    description:
      "Every high-stress zone—from the saddle gusset to pocket corners—is reinforced with military-grade double-needle lockstitching and genuine Japanese YKK brass hardware to eliminate blowouts.",
    icon: ShieldCheck,
    highlight: "Stress-tested durability",
  },
];
