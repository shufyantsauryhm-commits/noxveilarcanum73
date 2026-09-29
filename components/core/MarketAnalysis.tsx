"use client";

import { useState, useEffect } from 'react';

// Interface untuk bentuk data yang bakal diterima dari API
interface AnalysisData {
  pair: string;
  price: string;
  trend: 'UPTREND' | 'DOWNTREND' | 'SIDEWAYS';
  session: string;
  support: string;
  resistance: string;
  status: string;
  bias: 'BUY' | 'SELL' | 'WAIT';
}

export default function MarketAnalysis() {
  const [data, setData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);

  // Fungsi ambil data dari API
  const fetchMarketData = async () => {
    try {
      // GANTI URL INI dengan endpoint API backend kamu yang beneran ngitung AI
      // Contoh: fetch('/api/analysis?timeframe=M5')
      const res = await fetch('/api/market-analysis'); 
      const result = await res.json();
      
      // Simpan data dari API ke state
      setData(result);
    } catch (error) {
      console.error("Gagal ambil data market:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketData();
    // Refresh setiap 5 detik biar harga & sinyal update
    const interval = setInterval(fetchMarketData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Helper untuk warna trend
  const trendColor = (trend: string) => {
    if (trend === 'UPTREND') return 'text-green-400';
    if (trend === 'DOWNTREND') return 'text-red-400';
    return 'text-yellow-400';
  };

  // Helper untuk warna status
  const statusColor = (status: string) => {
    if (status.toLowerCase().includes('buy') || status.toLowerCase().includes('bullish')) return 'text-green-400';
    if (status.toLowerCase().includes('sell') || status.toLowerCase().includes('bearish')) return 'text-red-400';
    return 'text-yellow-400'; // WAIT
  };

  if (loading) {
    return <div className="text-gray-500 p-5">Loading market data...</div>;
  }

  return (
    <div className="rounded-2xl border border-orange-500/30 bg-black p-5 shadow-lg">
      <h2 className="text-xl font-bold text-orange-400">MARKET ANALYSIS</h2>

      {/* Menampilkan Timeframe AI lagi menganalisa (Contoh) */}
      <div className="mt-1 mb-4 text-[10px] text-gray-500 tracking-wider">
        ✓ Analyzing on M5 & H1 Structure
      </div>

      <div className="mt-3 space-y-3 text-white font-medium">
        <p className="flex justify-between">
          <span className="text-gray-500">PAIR :</span> 
          <span>{data?.pair || 'XAUUSD'}</span>
        </p>

        <p className="flex justify-between">
          <span className="text-gray-500">PRICE :</span> 
          <span className="text-yellow-300">{data?.price || '...'}</span>
        </p>

        <p className="flex justify-between">
          <span className="text-gray-500">TREND :</span> 
          <span className={trendColor(data?.trend || '')}>{data?.trend || '...'}</span>
        </p>

        <p className="flex justify-between">
          <span className="text-gray-500">SESSION :</span> 
          <span>{data?.session || 'ASIAN'}</span>
        </p>

        <hr className="border-gray-800 my-2" />

        <p className="flex justify-between">
          <span className="text-gray-500">SUPPORT :</span> 
          <span className="text-blue-400">{data?.support || '...'}</span>
        </p>

        <p className="flex justify-between">
          <span className="text-gray-500">RESISTANCE :</span> 
          <span className="text-red-400">{data?.resistance || '...'}</span>
        </p>

        <hr className="border-gray-800 my-2" />

        {/* Status dengan logic warna */}
        <p className={`font-bold ${statusColor(data?.status || 'WAIT')} text-right`}>
          STATUS : {data?.status || 'WAIT CONFIRMATION'}
        </p>
        
        {/* Menampilkan Bias AI biar transparan */}
        <p className="text-[10px] text-gray-600 text-right">
          AI Bias : {data?.bias || 'WAIT'}
        </p>
      </div>
    </div>
  );
}