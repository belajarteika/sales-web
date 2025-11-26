"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Search, Loader2 } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (code.length < 4) {
        throw new Error("Masukkan minimal 4 digit terakhir nomor HP");
      }

      // Search for customer with phone ending with these digits
      // Since we can't easily do 'ends_with' in standard Supabase filter without text search enabled or custom function,
      // we will fetch customers that match the 'like' pattern.
      // Pattern: %code

      const { data, error } = await supabase
        .from("customers")
        .select("id, name, phone")
        .ilike("phone", `%${code}`)
        .limit(1);

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error(
          "Data pelanggan tidak ditemukan. Coba periksa kembali."
        );
      }

      // Found, redirect to dashboard
      const customer = data[0];
      router.push(`/dashboard/${customer.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Portal Pelanggan
          </h1>
          <p className="text-gray-500">
            Cek status angsuran dan riwayat pembayaran Anda
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label
              htmlFor="code"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              6 Digit Terakhir Nomor HP
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="code"
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 transition-colors text-lg tracking-widest text-center"
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                maxLength={6}
                required
              />
            </div>
            <p className="mt-2 text-xs text-gray-500 text-center">
              Masukkan 4-6 digit terakhir nomor WhatsApp yang terdaftar
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || code.length < 4}
            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                Memproses...
              </>
            ) : (
              "Cek Data Saya"
            )}
          </button>
        </form>
      </div>

      <div className="mt-8 text-center text-xs text-gray-400">
        &copy; 2024 SalesApp Portal
      </div>
    </main>
  );
}
