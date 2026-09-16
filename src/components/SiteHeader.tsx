import Image from "next/image";
import Link from "next/link";
import { duongDan } from "@/lib/site-config";
import TimKiemHeader from "./TimKiemHeader";

export default function SiteHeader() {
  return (
    <header className="header">
      <div className="header-inner">
        <Link href="/" className="thuong-hieu">
          <Image
            className="logo-dau"
            src={duongDan("/brand/logo.png")}
            alt=""
            width={40}
            height={40}
            priority
            unoptimized
          />
          <div className="brand">
            <span className="brand-ten">Trung tâm Phục vụ Hành chính công</span>
            <span className="brand-phu">Xã Núi Cấm</span>
          </div>
        </Link>
        <TimKiemHeader />
      </div>
    </header>
  );
}
