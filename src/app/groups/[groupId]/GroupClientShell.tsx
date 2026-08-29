"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import AddExpenseModal from "@/components/AddExpenseModal";

interface GroupClientShellProps {
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
  };
  groups: Array<{
    id: string;
    name: string;
    role: string;
  }>;
  currentGroupId: string;
  role: string;
  members: Array<{ id: string; name: string; avatar?: string | null }>;
  categories: Array<{ id: string; name: string; icon: string }>;
  children: React.ReactNode;
}

export default function GroupClientShell({
  user,
  groups,
  currentGroupId,
  role,
  members,
  categories,
  children,
}: GroupClientShellProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  return (
    <>
      <Navbar
        user={user}
        groups={groups}
        currentGroupId={currentGroupId}
        onOpenAddExpense={() => setIsAddModalOpen(true)}
      />
      {children}
      <AddExpenseModal
        groupId={currentGroupId}
        members={members}
        categories={categories}
        currentUserId={user.id}
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </>
  );
}
