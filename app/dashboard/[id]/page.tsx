"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  User,
  CreditCard,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
} from "lucide-react";

type Installment = {
  id: string;
  month: number;
  amount: number;
  due_date: string;
  status: string;
  paid_date: string | null;
  notes: string;
};

type CustomerData = {
  id: string;
  name: string;
  phone: string;
  item: string;
  totalPrice: number;
  dp: number;
  tenor: number;
  monthly: number;
  installments: Installment[];
};

type InstallmentRow = {
  id: string;
  amount: number;
  due_date: string;
  status: string;
  paid_date: string | null;
  month: number;
};

type TransactionRow = {
  id: string;
  amount: number;
  notes: string | null;
  created_at: string;
  installments: InstallmentRow[];
};

export default function Dashboard() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [customerProfile, setCustomerProfile] = useState<{
    name: string;
    phone: string;
  } | null>(null);
  const [transactions, setTransactions] = useState<CustomerData[]>([]);
  const [selectedTrxIndex, setSelectedTrxIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        // 1. Fetch Customer Profile First
        const { data: custData, error: custError } = await supabase
          .from("customers")
          .select("name, phone")
          .eq("id", id)
          .single();

        if (custError) throw custError;
        setCustomerProfile(custData);

        // 2. Fetch ALL Active CICILAN Transactions for this customer
        const { data: trxData, error: trxError } = await supabase
          .from("transactions")
          .select(
            `
            id,
            amount,
            notes,
            created_at,
            installments (
              id,
              amount,
              due_date,
              status,
              paid_date,
              month
            )
          `
          )
          .eq("customer_id", id)
          .eq("type", "CICILAN")
          .order("created_at", { ascending: false });

        if (trxError) throw trxError;

        if (trxData && trxData.length > 0) {
          // Process each transaction
          // Cast trxData to unknown first then to TransactionRow[] to satisfy TS if needed,
          // or just rely on Supabase inference if it was perfect, but here we use explicit types for safety.
          const rows = trxData as unknown as TransactionRow[];

          const processedData = rows.map((trx) => {
            const installments = (trx.installments || [])
              .map((inst) => ({
                id: inst.id,
                month: inst.month,
                amount: inst.amount,
                due_date: inst.due_date,
                status: inst.status,
                notes: `Cicilan Ke-${inst.month}`,
                paid_date: inst.paid_date,
              }))
              .sort((a, b) => a.month - b.month);

            return {
              id: trx.id,
              name: custData?.name || "Pelanggan",
              phone: custData?.phone || "-",
              item: (trx.notes || "").replace("Cicilan: ", ""),
              totalPrice: trx.amount,
              dp: 0,
              tenor: installments.length,
              monthly: installments[0]?.amount || 0,
              installments: installments,
            };
          });

          setTransactions(processedData);
        } else {
          setTransactions([]);
        }
      } catch (err: unknown) {
        console.error(err);
        if (err instanceof Error) {
          setError(err.message || "Gagal memuat data");
        } else {
          setError("Gagal memuat data");
        }
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchData();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">Memuat data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Terjadi Kesalahan
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-medium transition-colors"
          >
            Kembali ke Login
          </button>
        </div>
      </div>
    );
  }

  // Handle No Transactions
  if (transactions.length === 0) {
    return (
      <main className="min-h-screen bg-gray-50 pb-12">
        <div className="bg-blue-600 text-white pt-8 pb-24 px-6 rounded-b-[2.5rem] shadow-lg relative overflow-hidden">
          <div className="max-w-md mx-auto relative z-10">
            <button
              onClick={() => router.push("/")}
              className="flex items-center text-blue-100 hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Keluar
            </button>
            <div className="flex items-center gap-4 mb-6">
              <div className="h-14 w-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/30">
                <User className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  {customerProfile?.name || "Pelanggan"}
                </h1>
                <p className="text-blue-100 text-sm">
                  {customerProfile?.phone || "-"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-md mx-auto px-6 -mt-16 relative z-20">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Tidak Ada Tagihan
            </h2>
            <p className="text-gray-500">
              Saat ini Anda tidak memiliki cicilan aktif. Terima kasih!
            </p>
          </div>
        </div>
      </main>
    );
  }

  const customer = transactions[selectedTrxIndex];
  const paidInstallments = customer.installments.filter(
    (i) => i.status === "Lunas"
  );
  const unpaidInstallments = customer.installments.filter(
    (i) => i.status !== "Lunas"
  );

  // Total Debt calculation might be slightly off without DP, but usually Total Price - Paid is what matters remaining.
  // If TotalPrice includes DP, then we need to subtract DP.
  // Assuming 'amount' in transaction is the Total Sales Price.
  // And installments sum up to (Total Price - DP).
  // So Remaining Debt = Sum of Unpaid Installments.
  const remainingDebt = unpaidInstallments.reduce(
    (sum, i) => sum + i.amount,
    0
  );

  const progress = Math.round((paidInstallments.length / customer.tenor) * 100);

  return (
    <main className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-blue-600 text-white pt-8 pb-24 px-6 rounded-b-[2.5rem] shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10 transform translate-x-1/3 -translate-y-1/3">
          <CreditCard size={200} />
        </div>

        <div className="max-w-md mx-auto relative z-10">
          <button
            onClick={() => router.push("/")}
            className="flex items-center text-blue-100 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Keluar
          </button>

          <div className="flex items-center gap-4 mb-6">
            <div className="h-14 w-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/30">
              <User className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{customer.name}</h1>
              <p className="text-blue-100 text-sm">{customer.phone}</p>
            </div>
          </div>

          {/* Item Selector if multiple */}
          {transactions.length > 1 ? (
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2 border border-white/20">
              <p className="text-blue-100 text-xs uppercase tracking-wider mb-2 px-2">
                Pilih Barang Cicilan ({transactions.length})
              </p>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {transactions.map((trx, idx) => (
                  <button
                    key={trx.id}
                    onClick={() => setSelectedTrxIndex(idx)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                      selectedTrxIndex === idx
                        ? "bg-white text-blue-600 shadow-sm"
                        : "bg-white/10 text-blue-100 hover:bg-white/20"
                    }`}
                  >
                    {trx.item}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
              <p className="text-blue-100 text-xs uppercase tracking-wider mb-1">
                Barang Cicilan
              </p>
              <p className="font-semibold text-lg truncate">{customer.item}</p>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 -mt-16 relative z-20 space-y-6">
        {/* Summary Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-gray-500 text-sm mb-1">Sisa Hutang</p>
              <h2 className="text-3xl font-bold text-gray-900">
                Rp {remainingDebt.toLocaleString("id-ID")}
              </h2>
            </div>
            <div className="h-10 w-10 bg-blue-50 rounded-full flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-blue-600" />
            </div>
          </div>

          <div className="relative h-2 bg-gray-100 rounded-full mb-2 overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-blue-600 rounded-full transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Progres {progress}%</span>
            <span>
              {paidInstallments.length} dari {customer.tenor} bulan
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500 mb-1">Angsuran/Bulan</p>
            <p className="font-bold text-gray-900">
              Rp {customer.monthly.toLocaleString("id-ID")}
            </p>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500 mb-1">Jatuh Tempo</p>
            <p className="font-bold text-gray-900">
              {unpaidInstallments.length > 0
                ? new Date(unpaidInstallments[0].due_date).getDate()
                : "-"}{" "}
              setiap bulan
            </p>
          </div>
        </div>

        {/* Installment List */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-gray-400" />
            Riwayat Angsuran
          </h3>

          <div className="space-y-3">
            {customer.installments.map((inst) => (
              <div
                key={inst.id}
                className={`p-4 rounded-xl border transition-all ${
                  inst.status === "Lunas"
                    ? "bg-white border-gray-100 shadow-sm"
                    : "bg-white border-blue-100 shadow-sm relative overflow-hidden"
                }`}
              >
                {inst.status !== "Lunas" && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
                )}

                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold text-gray-900">{inst.notes}</p>
                    <p className="text-xs text-gray-500">
                      {inst.status === "Lunas"
                        ? `Dibayar: ${
                            inst.paid_date
                              ? new Date(inst.paid_date).toLocaleDateString(
                                  "id-ID"
                                )
                              : "-"
                          }`
                        : `Jatuh Tempo: ${new Date(
                            inst.due_date
                          ).toLocaleDateString("id-ID")}`}
                    </p>
                  </div>
                  {inst.status === "Lunas" ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Lunas
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      <Clock className="w-3 h-3 mr-1" />
                      Belum
                    </span>
                  )}
                </div>

                <div className="flex justify-between items-end">
                  <p className="text-sm font-bold text-gray-900">
                    Rp {inst.amount.toLocaleString("id-ID")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
