"use client";
import { useParams } from "next/navigation";
import LessonPlayer from "@/components/LessonPlayer";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  return <LessonPlayer lessonId={Number(id)} />;
}
