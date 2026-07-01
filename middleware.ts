import { auth } from "@/auth";
import { NextResponse } from "next/server";

const PUBLIC_ROUTES = ["/login", "/signup"];

const ROLE_ROUTES: Record<string, string[]> = {
  "/dashboard/users": ["OWNER"],
  "/dashboard/settings": ["OWNER"],
  "/dashboard/quality": ["OWNER", "QA_PERSONNEL"],
  "/dashboard/deliveries": ["OWNER", "STOCK_KEEPER", "DRIVER"],
  "/dashboard/suppliers": ["OWNER", "STOCK_KEEPER"],
  "/dashboard/sales": ["OWNER", "CASHIER", "PHARMACIST"],
  "/dashboard/medicines/new": ["OWNER", "STOCK_KEEPER"],
  "/dashboard/medicines": ["OWNER", "STOCK_KEEPER", "PHARMACIST", "QA_PERSONNEL"],
  "/dashboard/customers": ["OWNER", "CASHIER", "PHARMACIST"],
  "/dashboard/interactions": ["OWNER", "PHARMACIST"],
  "/dashboard/logs": ["OWNER", "SECURITY"],
};

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isPublic = PUBLIC_ROUTES.includes(nextUrl.pathname);

  if (!session && !isPublic) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  if (session && isPublic) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  if (session) {
    const role = (session.user as any).role as string;
    const matchedRoute = Object.keys(ROLE_ROUTES).find((route) =>
      nextUrl.pathname.startsWith(route)
    );

    if (matchedRoute && !ROLE_ROUTES[matchedRoute].includes(role)) {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
