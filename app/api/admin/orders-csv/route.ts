import { NextRequest, NextResponse } from "next/server";

import { getAdminOrders } from "@/actions/admin-order.action";
import { auth } from "@/auth";
import { isAdmin } from "@/lib/roles";

const cell = (v: unknown) => {
  const s = String(v ?? "");
  // Quote, escape quotes, and neutralise spreadsheet formulas.
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
};

// Admin-only CSV of the orders list with the same filters as the page.
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || !isAdmin(session.user.role)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const p = req.nextUrl.searchParams;
  const rows: string[] = [
    ["Order", "Date", "Customer", "Email", "Items", "Payment", "Paid", "Status", "Items total", "Shipping", "Tax", "Total", "City", "Country"].map(cell).join(","),
  ];
  let page = 1;
  for (;;) {
    const data = await getAdminOrders({
      status: p.get("status") ?? "all",
      q: p.get("q") ?? undefined,
      period: p.get("period") ?? "30d",
      payment: p.get("payment") ?? "all",
      page,
      limit: 200,
    });
    for (const o of data.orders) {
      rows.push(
        [
          o.orderNumber,
          new Date(o.createdAt).toISOString(),
          o.customer?.name ?? o.shippingAddress.fullName,
          o.customer?.email ?? "",
          o.items.reduce((n, i) => n + i.quantity, 0),
          o.paymentMethod,
          o.isPaid ? "yes" : "no",
          o.status,
          o.itemsPrice,
          o.shippingPrice,
          o.taxPrice,
          o.totalPrice,
          o.shippingAddress.city,
          o.shippingAddress.country,
        ]
          .map(cell)
          .join(",")
      );
    }
    if (page >= data.totalPages) break;
    page++;
  }
  return new NextResponse("﻿" + rows.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="walstore-orders-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
