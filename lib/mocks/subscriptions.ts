export const mockSubscriptionPriceHistory = [
    { id: 'ph1', subscriptionId: 's1', amount: 2000, currency: 'JPY' as const, effectiveFrom: new Date('2023-04-01'), note: '初期契約' },
    { id: 'ph2', subscriptionId: 's1', amount: 2500, currency: 'JPY' as const, effectiveFrom: new Date('2024-04-01'), note: '料金改定' },
    { id: 'ph3', subscriptionId: 's2', amount: 7.25, currency: 'USD' as const, effectiveFrom: new Date('2022-10-01'), note: 'Pro plan' },
    { id: 'ph4', subscriptionId: 's2', amount: 8.75, currency: 'USD' as const, effectiveFrom: new Date('2024-01-01'), note: 'Pro plan 値上げ' },
    { id: 'ph5', subscriptionId: 's3', amount: 6480, currency: 'JPY' as const, effectiveFrom: new Date('2023-11-01'), note: '単体プラン' },
    { id: 'ph6', subscriptionId: 's4', amount: 4, currency: 'USD' as const, effectiveFrom: new Date('2023-01-15'), note: 'Team plan / seat' },
    { id: 'ph7', subscriptionId: 's4', amount: 4, currency: 'USD' as const, effectiveFrom: new Date('2024-06-01'), note: '価格据え置き' },
    { id: 'ph8', subscriptionId: 's5', amount: 1360, currency: 'JPY' as const, effectiveFrom: new Date('2022-06-01'), note: 'Business Starter' },
    { id: 'ph9', subscriptionId: 's5', amount: 1700, currency: 'JPY' as const, effectiveFrom: new Date('2023-10-01'), note: 'Business Standard へ移行' },
    // Annual billing
    { id: 'ph10', subscriptionId: 's6', amount: 50000, currency: 'JPY' as const, effectiveFrom: new Date('2024-01-01'), note: '年間契約' },
    // Usage-based
    { id: 'ph11', subscriptionId: 's7', amount: 0, currency: 'USD' as const, effectiveFrom: new Date('2024-03-01'), note: '従量課金（目安 $30〜120/月）' },
];

export const getLatestPrice = (subscriptionId: string) => {
    const hist = mockSubscriptionPriceHistory
        .filter((h) => h.subscriptionId === subscriptionId)
        .sort((a, b) => new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime());
    return hist[0] ?? null;
};

export const mockSubscriptions = [
    { id: 's1', serviceName: 'Notion', serviceUrl: 'https://notion.so', corporateName: 'Notion Labs, Inc.', billingInterval: 'monthly' as const, branchId: 'b1', assigneeEmployeeId: 'emp_1', currentCurrency: 'JPY' as const, createdAt: new Date('2023-04-01'), updatedAt: new Date('2024-04-01') },
    { id: 's2', serviceName: 'Slack', serviceUrl: 'https://slack.com', corporateName: 'Salesforce Japan 株式会社', billingInterval: 'monthly' as const, branchId: 'b1', assigneeEmployeeId: 'emp_2', currentCurrency: 'USD' as const, createdAt: new Date('2022-10-01'), updatedAt: new Date('2024-01-01') },
    { id: 's3', serviceName: 'Adobe Creative Cloud', serviceUrl: 'https://adobe.com', corporateName: 'アドビ株式会社', billingInterval: 'monthly' as const, branchId: 'b2', assigneeEmployeeId: 'emp_3', currentCurrency: 'JPY' as const, createdAt: new Date('2023-11-01'), updatedAt: new Date('2023-11-01') },
    { id: 's4', serviceName: 'GitHub Team', serviceUrl: 'https://github.com', corporateName: 'GitHub, Inc.', billingInterval: 'monthly' as const, branchId: 'b1', assigneeEmployeeId: 'emp_1', currentCurrency: 'USD' as const, createdAt: new Date('2023-01-15'), updatedAt: new Date('2024-06-01') },
    { id: 's5', serviceName: 'Google Workspace', serviceUrl: 'https://workspace.google.com', corporateName: 'グーグル合同会社', billingInterval: 'monthly' as const, branchId: null, assigneeEmployeeId: 'emp_2', currentCurrency: 'JPY' as const, createdAt: new Date('2022-06-01'), updatedAt: new Date('2023-10-01') },
    { id: 's6', serviceName: 'Figma Professional', serviceUrl: 'https://figma.com', corporateName: 'Figma, Inc.', billingInterval: 'annual' as const, branchId: 'b1', assigneeEmployeeId: 'emp_1', currentCurrency: 'JPY' as const, createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
    { id: 's7', serviceName: 'AWS', serviceUrl: 'https://aws.amazon.com', corporateName: 'Amazon Web Services Japan', billingInterval: 'usage' as const, branchId: 'b1', assigneeEmployeeId: 'emp_2', currentCurrency: 'USD' as const, createdAt: new Date('2024-03-01'), updatedAt: new Date('2024-03-01') },
];
