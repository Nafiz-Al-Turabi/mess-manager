import { jsPDF } from 'jspdf';
import {
  DepositRecord,
  ExpenseRecord,
  MealRecord,
  MemberAccountingSummary,
  MonthlyMessAccounting,
} from './types';

function asciiSafeText(text: string): string {
  // jsPDF standard Helvetica font supports ASCII characters.
  // Extract English portion in parentheses if present, or strip non-ASCII cleanly with fallback.
  const parenMatch = text.match(/\(([^)]+)\)/);
  const asciiOnly = text.replace(/[^\x20-\x7E]/g, '').trim();
  if (parenMatch && parenMatch[1]) {
    const rest = text
      .replace(/\([^)]+\)/g, '')
      .replace(/[^\x20-\x7E]/g, '')
      .trim();
    return rest ? `${parenMatch[1]} (${rest})` : parenMatch[1];
  }
  return asciiOnly || 'Record';
}

export function generateMonthlyMessPdf(params: {
  messName: string;
  messId: string;
  monthKey: string;
  accounting: MonthlyMessAccounting;
  expenses: ExpenseRecord[];
  deposits: DepositRecord[];
}): void {
  const { messName, messId, monthKey, accounting } = params;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Header Banner
  doc.setFillColor(23, 49, 37); // PineDark #173125
  doc.rect(0, 0, 210, 34, 'F');

  doc.setTextColor(254, 210, 79); // SunGold #FED24F
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(`MESS HISAB - MONTHLY ACCOUNTING REPORT`, 14, 15);

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(
    `Mess Code: ${asciiSafeText(messId)} | Mess Name: ${asciiSafeText(messName)} | Month: ${monthKey}`,
    14,
    23
  );
  doc.text(
    `Generated: ${new Date().toISOString().slice(0, 16).replace('T', ' ')} | Active Members: ${accounting.activeMemberCount}`,
    14,
    29
  );

  // KPI Summary Boxes
  let y = 42;
  doc.setFillColor(244, 248, 243);
  doc.setDrawColor(67, 138, 83); // ForestGreen #438A53
  doc.roundedRect(14, y, 182, 24, 2, 2, 'FD');

  doc.setTextColor(23, 49, 37);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`Meal Rate: BDT ${accounting.mealRate.toFixed(2)}`, 20, y + 8);
  doc.text(`Total Meals: ${accounting.totalMessMeals.toFixed(1)}`, 82, y + 8);
  doc.text(`Food Bazar: BDT ${Math.round(accounting.totalFoodCost)}`, 140, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.text(`Shared Bills: BDT ${Math.round(accounting.totalSharedCost)}`, 20, y + 17);
  doc.text(
    `Shared / Member: BDT ${Math.round(accounting.perMemberSharedCost)}`,
    82,
    y + 17
  );
  doc.text(`Cash in Hand: BDT ${Math.round(accounting.cashInHand)}`, 140, y + 17);

  // Member Accounting Table
  y += 34;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(23, 49, 37);
  doc.text('Member Accounting Breakdown', 14, y);

  y += 5;
  doc.setFillColor(67, 138, 83);
  doc.rect(14, y, 182, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8.5);
  doc.text('Member (Room)', 16, y + 5.5);
  doc.text('Meals', 74, y + 5.5);
  doc.text('Meal Cost', 94, y + 5.5);
  doc.text('Shared', 118, y + 5.5);
  doc.text('Total Cost', 138, y + 5.5);
  doc.text('Total Credit', 160, y + 5.5);
  doc.text('Net Balance', 180, y + 5.5);

  y += 8;
  doc.setFont('helvetica', 'normal');
  accounting.memberSummaries.forEach((ms, idx) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    if (idx % 2 === 1) {
      doc.setFillColor(246, 249, 245);
      doc.rect(14, y, 182, 8, 'F');
    }
    doc.setTextColor(23, 49, 37);
    const label = `${asciiSafeText(ms.member.name)} (${ms.member.roomNumber || '-'})`;
    doc.text(label.slice(0, 28), 16, y + 5.5);
    doc.text(ms.totalMeals.toFixed(1), 74, y + 5.5);
    doc.text(`${Math.round(ms.mealCost)}`, 94, y + 5.5);
    doc.text(`${Math.round(ms.sharedCost)}`, 118, y + 5.5);
    doc.text(`${Math.round(ms.totalCost)}`, 138, y + 5.5);
    doc.text(`${Math.round(ms.totalCredit)}`, 160, y + 5.5);

    const net = Math.round(ms.netBalance);
    if (net >= 0) {
      doc.setTextColor(22, 128, 60);
      doc.text(`+${net} (Get)`, 180, y + 5.5);
    } else {
      doc.setTextColor(200, 35, 35);
      doc.text(`${net} (Due)`, 180, y + 5.5);
    }
    y += 8;
  });

  // Formula Note Footer
  y += 8;
  doc.setFontSize(8);
  doc.setTextColor(90, 105, 95);
  doc.text(
    'Formula: Total Cost = (Member Meals x Meal Rate) + Shared Cost. Net Balance = (Cash Deposits + Paid Bazar/Bills) - Total Cost.',
    14,
    y
  );

  doc.save(`Mess_${messId}_Report_${monthKey}.pdf`);
}

export function generateMemberStatementPdf(params: {
  messName: string;
  messId: string;
  monthKey: string;
  mealRate: number;
  summary: MemberAccountingSummary;
  memberMeals: MealRecord[];
  memberDeposits: DepositRecord[];
  memberPaidExpenses: ExpenseRecord[];
}): void {
  const { messName, messId, monthKey, mealRate, summary, memberMeals, memberDeposits, memberPaidExpenses } = params;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  doc.setFillColor(23, 49, 37);
  doc.rect(0, 0, 210, 32, 'F');

  doc.setTextColor(254, 210, 79);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(`MEMBER INDIVIDUAL STATEMENT - ${monthKey}`, 14, 14);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Member: ${asciiSafeText(summary.member.name)} | Room: ${summary.member.roomNumber} | Phone: ${summary.member.phone}`,
    14,
    22
  );
  doc.text(`Mess: ${asciiSafeText(messName)} (${messId}) | Role: ${summary.member.role}`, 14, 28);

  let y = 40;
  doc.setFillColor(244, 248, 243);
  doc.setDrawColor(67, 138, 83);
  doc.roundedRect(14, y, 182, 26, 2, 2, 'FD');

  doc.setTextColor(23, 49, 37);
  doc.setFont('helvetica', 'bold');
  doc.text(
    `Total Meals: ${summary.totalMeals.toFixed(1)} (B:${summary.breakfastCount} L:${summary.lunchCount} D:${summary.dinnerCount} G:${summary.guestMealCount})`,
    20,
    y + 8
  );
  doc.text(
    `Meal Cost: BDT ${Math.round(summary.mealCost)} (@ ${mealRate.toFixed(2)}) | Shared Cost: BDT ${Math.round(summary.sharedCost)}`,
    20,
    y + 15
  );
  const net = Math.round(summary.netBalance);
  doc.text(
    `Total Cost: BDT ${Math.round(summary.totalCost)} | Total Credit: BDT ${Math.round(summary.totalCredit)} | Net: ${net >= 0 ? `+BDT ${net} (Refundable)` : `-BDT ${Math.abs(net)} (Due)`}`,
    20,
    y + 22
  );

  y += 35;
  doc.setFontSize(11);
  doc.text(`Deposits (${memberDeposits.length}) & Out-of-Pocket Expenses Paid (${memberPaidExpenses.length})`, 14, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  memberDeposits.forEach((d) => {
    doc.text(
      `[Deposit] ${d.date} - BDT ${d.amount} via ${d.paymentMethod} (${d.transactionRef || '-'})`,
      16,
      y
    );
    y += 6;
  });

  memberPaidExpenses.forEach((e) => {
    doc.text(
      `[Paid Expense] ${e.date} - BDT ${e.amount} for ${asciiSafeText(e.title)} (${e.category})`,
      16,
      y
    );
    y += 6;
  });

  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`Recorded Meal Days (${memberMeals.length})`, 14, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  memberMeals.slice(0, 22).forEach((m) => {
    const daySum = m.breakfast + m.lunch + m.dinner + m.guestMeal;
    doc.text(
      `${m.date}: Total ${daySum.toFixed(1)} [B:${m.breakfast}, L:${m.lunch}, D:${m.dinner}, Guest:${m.guestMeal}]`,
      16,
      y
    );
    y += 5.5;
  });

  doc.save(`Statement_${asciiSafeText(summary.member.name).replace(/\s+/g, '_')}_${monthKey}.pdf`);
}
