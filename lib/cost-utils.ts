import { Asset } from './types';

export function calculateAssetCosts(asset: Asset): { monthly: number; total: number } {
    let monthly = 0;
    let total = 0;

    if (asset.ownership === 'owned') {
        total = asset.purchaseCost || 0;
        const months = asset.depreciationMonths || 0;
        if (months > 0) {
            monthly = Math.round(total / months);
        }
    } else if (asset.ownership === 'rental' || asset.ownership === 'lease') {
        monthly = asset.monthlyCost || 0;

        // Calculate total cost based on return date or contract months
        if (asset.returnDate && asset.purchaseDate) {
            // If returned, calculate actual duration
            const start = new Date(asset.purchaseDate);
            const end = new Date(asset.returnDate);
            // Calculate difference in months (approximate)
            const diffTime = Math.abs(end.getTime() - start.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            // Simple calculation: days / 30. Or use year/month diff.
            // Let's use year/month diff for better accuracy with calendar months
            let monthsDiff = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
            // Adjust for partial months if needed, but usually rental is monthly. 
            // If end day is less than start day, maybe subtract one? 
            // Let's keep it simple: if it spans into a new month, count it?
            // Requirement doesn't specify partial month logic. 
            // Let's assume full months for simplicity or just use the diff.
            // If I rent on Jan 1 and return Jan 31, is it 1 month? Yes.
            // If I rent on Jan 1 and return Feb 1, is it 2 months? Probably.
            // Let's use a slightly more robust diff.
            if (end.getDate() >= start.getDate()) {
                monthsDiff += 1; // Count the current month if we passed the start day
            }
            // Ensure at least 1 month if dates are valid and end > start
            const actualMonths = Math.max(1, monthsDiff);
            total = monthly * actualMonths;
        } else {
            // If not returned, use contract months if available
            const months = asset.months || 0;
            if (months > 0) {
                total = monthly * months;
            }
        }
    }

    return { monthly, total };
}
