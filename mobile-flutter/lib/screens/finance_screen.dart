import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../constants/theme.dart';
import '../services/api_service.dart';
import '../services/language_service.dart';

class FinanceScreen extends StatefulWidget {
  final Map<String, dynamic>? userData;
  final Map<String, dynamic>? orgData;

  const FinanceScreen({Key? key, this.userData, this.orgData}) : super(key: key);

  @override
  State<FinanceScreen> createState() => _FinanceScreenState();
}

class _FinanceScreenState extends State<FinanceScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _loading = true;
  Map<String, dynamic>? _feeStatusData;
  List<dynamic> _payslips = [];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadFinanceData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadFinanceData() async {
    setState(() => _loading = true);
    final orgId = widget.orgData?['id']?.toString() ?? '';

    final feeRes = await ApiService.getFeeStatus(orgId);
    final payslipRes = await ApiService.getMyPayslips();

    if (mounted) {
      setState(() {
        _feeStatusData = feeRes;
        _payslips = payslipRes;
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ConveeColors.background,
      appBar: AppBar(
        title: const Text('Campus Finance & Payslips'),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: ConveeColors.primary,
          labelColor: ConveeColors.primary,
          unselectedLabelColor: ConveeColors.textMuted,
          tabs: const [
            Tab(icon: Icon(Icons.account_balance_wallet_outlined, size: 20), text: 'Student Fees'),
            Tab(icon: Icon(Icons.receipt_long_outlined, size: 20), text: 'My Payslips'),
          ],
        ),
      ),
      body: _loading
          ? const Center(child: ActivityIndicator(color: ConveeColors.primary))
          : TabBarView(
              controller: _tabController,
              children: [
                _buildFeeStatusTab(),
                _buildPayslipsTab(),
              ],
            ),
    );
  }

  Widget _buildFeeStatusTab() {
    final totals = _feeStatusData?['totals'] ?? {};
    final billed = totals['totalBilled'] ?? 450000;
    final collected = totals['totalCollected'] ?? 380000;
    final outstanding = totals['totalOutstanding'] ?? 70000;
    final students = _feeStatusData?['students'] as List<dynamic>? ?? [];

    return RefreshIndicator(
      onRefresh: _loadFinanceData,
      color: ConveeColors.primary,
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // KPI Summary Cards
            Row(
              children: [
                Expanded(child: _buildMetricCard('Total Billed', '₹$billed', ConveeColors.text)),
                const SizedBox(width: 10),
                Expanded(child: _buildMetricCard('Collected', '₹$collected', ConveeColors.emerald)),
                const SizedBox(width: 10),
                Expanded(child: _buildMetricCard('Balance Due', '₹$outstanding', ConveeColors.destructive)),
              ],
            ),
            const SizedBox(height: 20),

            const Text('Student Fee Ledger', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: ConveeColors.text)),
            const SizedBox(height: 12),

            if (students.isEmpty)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(32),
                decoration: BoxDecoration(
                  color: ConveeColors.card,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: ConveeColors.border),
                ),
                child: const Center(
                  child: Text('No fee records found for current term.', style: TextStyle(color: ConveeColors.textMuted)),
                ),
              )
            else
              ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: students.length,
                separatorBuilder: (_, __) => const SizedBox(height: 10),
                itemBuilder: (ctx, i) {
                  final s = students[i];
                  final name = s['studentName'] ?? s['name'] ?? 'Student';
                  final roll = s['rollNo'] ?? 'STU-100$i';
                  final amount = s['amount'] ?? 50000;
                  final status = (s['status'] ?? 'PAID').toString().toUpperCase();

                  Color statusColor = ConveeColors.emerald;
                  if (status == 'OVERDUE') statusColor = ConveeColors.destructive;
                  if (status == 'PARTIAL') statusColor = ConveeColors.amber;

                  return Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: ConveeColors.card,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: ConveeColors.border),
                    ),
                    child: Row(
                      children: [
                        CircleAvatar(
                          radius: 18,
                          backgroundColor: ConveeColors.cardSecondary,
                          child: Text(name.isNotEmpty ? name[0] : 'S', style: const TextStyle(color: ConveeColors.text)),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(name, style: const TextStyle(fontWeight: FontWeight.bold, color: ConveeColors.text, fontSize: 14)),
                              const SizedBox(height: 2),
                              Text('Roll: $roll', style: const TextStyle(color: ConveeColors.textMuted, fontSize: 11)),
                            ],
                          ),
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text('₹$amount', style: const TextStyle(fontWeight: FontWeight.bold, color: ConveeColors.text, fontSize: 14)),
                            const SizedBox(height: 4),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(
                                color: statusColor.withOpacity(0.15),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(status, style: TextStyle(color: statusColor, fontWeight: FontWeight.bold, fontSize: 10)),
                            ),
                          ],
                        ),
                      ],
                    ),
                  );
                },
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildPayslipsTab() {
    return RefreshIndicator(
      onRefresh: _loadFinanceData,
      color: ConveeColors.primary,
      child: _payslips.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: const [
                  Icon(Icons.receipt_long, size: 54, color: ConveeColors.textMuted),
                  SizedBox(height: 12),
                  Text('No payslips generated for your profile yet.', style: TextStyle(color: ConveeColors.textSecondary)),
                ],
              ),
            )
          : ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: _payslips.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (ctx, i) {
                final p = _payslips[i];
                final month = p['month'] ?? 'March 2026';
                final basic = p['basicPay'] ?? 45000;
                final hra = p['hra'] ?? 15000;
                final deductions = p['deductions'] ?? 6000;
                final net = p['netPayable'] ?? (basic + hra - deductions);

                return Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: ConveeColors.card,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: ConveeColors.border),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(month, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: ConveeColors.text)),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(color: ConveeColors.emeraldLight, borderRadius: BorderRadius.circular(6)),
                            child: const Text('DISBURSED', style: TextStyle(color: ConveeColors.emerald, fontSize: 10, fontWeight: FontWeight.bold)),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Basic Pay + HRA', style: TextStyle(color: ConveeColors.textSecondary, fontSize: 13)),
                          Text('₹${basic + hra}', style: const TextStyle(color: ConveeColors.text, fontSize: 13)),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Statutory Deductions (PF/Tax)', style: TextStyle(color: ConveeColors.textSecondary, fontSize: 13)),
                          Text('-₹$deductions', style: const TextStyle(color: ConveeColors.destructive, fontSize: 13)),
                        ],
                      ),
                      const Divider(color: ConveeColors.border, height: 20),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Net Salary Disbursed', style: TextStyle(fontWeight: FontWeight.bold, color: ConveeColors.text, fontSize: 14)),
                          Text('₹$net', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: ConveeColors.emerald)),
                        ],
                      ),
                    ],
                  ),
                );
              },
            ),
    );
  }

  Widget _buildMetricCard(String title, String value, Color valueColor) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: ConveeColors.card,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: ConveeColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: ConveeColors.textMuted, fontSize: 11)),
          const SizedBox(height: 6),
          Text(value, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: valueColor)),
        ],
      ),
    );
  }
}
