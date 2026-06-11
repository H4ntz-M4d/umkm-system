"use client";

import ExpenseCategoriesView from "@/components/management/expense/category-expenses-grid";
import ExpenseCategoriesForm from "@/components/management/expense/expense-categories-form";
import { AddExpenseDialog } from "@/components/management/expense/expense-form";
import ExpenseSummary from "@/components/management/expense/expense-summary";
import ExpenseView from "@/components/management/expense/expense-view";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExpenseFilters } from "@/lib/queries/expense/expense.query";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

export default function Page() {
  const [activeTab, setActiveTab] = useState("expenses");
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isExpenseCategoriesOpen, setIsExpenseCategoriesOpen] = useState(false);
  const searchParams = useSearchParams();
  
  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 10;
  const startDate = searchParams.get("startDate") || "";
  const endDate = searchParams.get("endDate") || "";
  const filters: ExpenseFilters = {
    skip: (page - 1) * limit,
    limit: limit,
    search: searchParams.get("search") || "",
    category: searchParams.get("category") || "",
    dateFrom: startDate,
    dateTo: endDate,
  };

  return (
    <main className="flex flex-1 flex-col gap-4 py-4 px-6 pt-0">
      <div className="my-5 flex flex-row justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-4xl font-instrument">Pengeluaran</h2>
          <p className="text-sm">
            Kelola pengeluaran, kategori pengeluaran, dan catatan financial Anda
            dengan mudah
          </p>
        </div>
        {activeTab === "expenses" ? (
          <Button onClick={() => setIsAddExpenseOpen(true)}>
            Tambah Pengeluaran Baru
          </Button>
        ) : (
          <Button onClick={() => setIsExpenseCategoriesOpen(true)}>
            Tambah Kategori
          </Button>
        )}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-5 mb-5">
        <ExpenseSummary />
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full max-w-md">
          <TabsTrigger
            value="expenses"
            className="flex-1 font-semibold data-active:text-foreground/70"
          >
            Catatan Pengeluaran
          </TabsTrigger>
          <TabsTrigger
            value="category"
            className="flex-1 font-semibold data-active:text-foreground/70"
          >
            Kategori Pengeluaran
          </TabsTrigger>
        </TabsList>
        <TabsContent value="expenses" className="flex flex-1 flex-col gap-4">
          <ExpenseView filters={filters} />
        </TabsContent>
        <TabsContent value="category" className="flex flex-1 flex-col gap-4">
          <ExpenseCategoriesView />
        </TabsContent>
      </Tabs>

      <div>
        <AddExpenseDialog
          open={isAddExpenseOpen}
          onOpenChange={setIsAddExpenseOpen}
        />
        <ExpenseCategoriesForm
          open={isExpenseCategoriesOpen}
          onOpenChange={setIsExpenseCategoriesOpen}
        />
      </div>

      <Toaster />
    </main>
  );
}
