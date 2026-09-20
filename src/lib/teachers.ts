import type { Role } from "@/lib/types";

export interface TeacherAccount {
  /** Stable id used as `profiles.id` and `books.teacher_id` */
  id: string;
  username: string;
  password: string;
  full_name: string;
  avatar_hue: number;
}

/**
 * Hidden teacher accounts (username + password, no email).
 * In production these live in `profiles` + Supabase Auth; the list is kept
 * server-side only and is never shipped to the browser bundle.
 */
export const TEACHER_ACCOUNTS: TeacherAccount[] = [
  {
    id: "3f2a1b40-0001-4a10-9f21-1a2b3c4d0001",
    username: "teacher1_hamid",
    password: "Xk9mP2qL7w",
    full_name: "Mr. Basiri (Hamid)",
    avatar_hue: 222,
  },
  {
    id: "3f2a1b40-0002-4a10-9f21-1a2b3c4d0002",
    username: "teacher2_sara",
    password: "B4nR8tY3vZ",
    full_name: "Ms. Basiri (Sara)",
    avatar_hue: 330,
  },
  {
    id: "3f2a1b40-0003-4a10-9f21-1a2b3c4d0003",
    username: "teacher3_reza",
    password: "M6cQ1sD9fH",
    full_name: "Mr. Basiri (Reza)",
    avatar_hue: 152,
  },
  {
    id: "3f2a1b40-0004-4a10-9f21-1a2b3c4d0004",
    username: "teacher4_mina",
    password: "T5jW7eK2pA",
    full_name: "Ms. Basiri (Mina)",
    avatar_hue: 32,
  },
  {
    id: "3f2a1b40-0005-4a10-9f21-1a2b3c4d0005",
    username: "teacher5_ali",
    password: "R3yU8iO4nC",
    full_name: "Mr. Basiri (Ali)",
    avatar_hue: 272,
  },
  {
    id: "3f2a1b40-0006-4a10-9f21-1a2b3c4d0006",
    username: "mr.khotanlo",
    password: "Khotanlo1678",
    full_name: "Mr. Khotanlo",
    avatar_hue: 196,
  },
  {
    id: "3f2a1b40-0007-4a10-9f21-1a2b3c4d0007",
    username: "mr.babaeian",
    password: "Babaeian1389",
    full_name: "Mr. Babaeian",
    avatar_hue: 12,
  },
];

export function findTeacherByUsername(
  username: string,
): TeacherAccount | undefined {
  const normalized = username.trim().toLowerCase();
  return TEACHER_ACCOUNTS.find(
    (account) => account.username.toLowerCase() === normalized,
  );
}

export function getTeacherById(id: string): TeacherAccount | undefined {
  return TEACHER_ACCOUNTS.find((account) => account.id === id);
}

export const STUDENT_ROLE: Role = "student";
