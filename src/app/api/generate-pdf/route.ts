import { AppContentStorageKey } from "@/constants/app";
import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";

export async function POST(request: Request) {
  try {
    const requestPayload = await request.json();
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.evaluateOnNewDocument((requestPayload) => {
      if (requestPayload) {
        localStorage.setItem("cv-content", JSON.stringify(requestPayload));
      }
    }, requestPayload);

    await page.goto("http://localhost:3000/preview", {
      waitUntil: "networkidle0",
    });

    await page.emulateMediaType("print");
    const scaleDownRate = 0.89;
    const pdfBuffer = await page.pdf({
      scale: scaleDownRate,
      format: "a4",
      printBackground: true,
      margin: {
        top: 40 * scaleDownRate,
        right: 40 * scaleDownRate,
        bottom: 40 * scaleDownRate,
        left: 40 * scaleDownRate,
      },
    });

    await browser.close();

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="generated.pdf"',
      },
    });
  } catch (error: any) {
    console.log(error);
    return NextResponse.json(
      { error: "Error on generating PDF" },
      { status: 500 }
    );
  }
}
