"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import IconTimKiem from "./IconTimKiem";

/** Ô tìm kiếm nhanh trên thanh điều hướng — Enter thì chuyển sang trang danh mục. */
export default function TimKiemHeader() {
  const router = useRouter();
  const [tuKhoa, setTuKhoa] = useState("");

  function guiTimKiem(e: React.FormEvent) {
    e.preventDefault();
    const q = tuKhoa.trim();
    if (q) router.push(`/danh-muc/?q=${encodeURIComponent(q)}`);
  }

  return (
    <form className="header-search" onSubmit={guiTimKiem} role="search">
      <div className="o-tim-mini">
        <IconTimKiem />
        <label htmlFor="tim-header" className="bo-qua-dieu-huong">
          Tìm thủ tục hành chính
        </label>
        <input
          id="tim-header"
          type="search"
          placeholder="Tìm thủ tục, mã TTHC…"
          value={tuKhoa}
          onChange={(e) => setTuKhoa(e.target.value)}
        />
      </div>
    </form>
  );
}
