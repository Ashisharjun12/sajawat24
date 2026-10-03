/** Integer paise only. Never use JS floats for money. See docs/project-requriment.md */

export type Paise = number;

export function rupeesToPaise(rupees: number): Paise {
    return Math.round(rupees * 100);
}

export function paiseToRupees(paise: Paise): number {
    return paise / 100;
}

export function addPaise(...amounts: Paise[]): Paise {
    return amounts.reduce((sum, amount) => sum + amount, 0);
}
