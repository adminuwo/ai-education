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
  late String _role;
  bool _canViewCampusFees = false;
  bool _isStudentOrParent = false;

  @override
  void initState() {
    super.initState();
    _role = (widget.orgData?['role'] ??
            widget.userData?['role'] ??
            widget.userData?['systemRole'] ??
            ApiService.currentRole)
        .toString()
        .toUpperCase();
    _isStudentOrParent = _role == 'STUDENT' || _role == 'PARENT';
    _canViewCampusFees = ['ADMIN', 'DIRECTOR', 'PRINCIPAL', 'DEAN', 'HOD', 'ACCOUNTANT', 'OWNER'].contains(_role) ||
        (widget.userData?['systemRole']?.toString().toUpperCase() == 'SUPER_ADMIN') ||
        (ApiService.currentUser?['systemRole']?.toString().toUpperCase() == 'SUPER_ADMIN');

    final tabLength = _canViewCampusFees ? 2 : 1;
    _tabController = TabController(length: tabLength, vsync: this);
    _loadFinanceData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadFinanceData() async {
    setState(() => _loading = true);
    final orgId = widget.orgData?['id']?.toString() ?? ApiService.currentOrgId ?? '';

    final feeRes = _canViewCampusFees ? await ApiService.getFeeStatus(orgId) : null;
    final payslipRes = await ApiService.getMyPayslips(orgId: orgId);

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
    if (_isStudentOrParent) {
      return Scaffold(
        backgroundColor: ConveeColors.background,
        appBar: AppBar(
          title: const Text('Campus Finance'),
          leading: IconButton(
            icon: const Icon(Icons.arrow_back, color: ConveeColors.text),
            onPressed: () => Navigator.of(context).pop(),
          ),
        ),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.lock_outline, size: 64, color: ConveeColors.emerald.withOpacity(0.8)),
                const SizedBox(height: 16),
                const Text(
                  'Staff Finance Portal',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: ConveeColors.text),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                const Text(
                  'Institutional fee collection ledgers and payroll records are restricted to staff. For student fee payment receipts and history, please open the Parent & Student Portal.',
                  style: const TextStyle(fontSize: 14, color: ConveeColors.textSecondary),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 24),
                ElevatedButton.icon(
                  onPressed: () => Navigator.of(context).pop(),
                  icon: const Icon(Icons.arrow_back, size: 18),
                  label: const Text('Back to Dashboard'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: ConveeColors.primary,
                    foregroundColor: Colors.black,
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    if (!_canViewCampusFees) {
      return Scaffold(
        backgroundColor: ConveeColors.background,
        appBar: AppBar(
          title: const Text('My Payslips'),
          leading: IconButton(
            icon: const Icon(Icons.arrow_back, color: ConveeColors.text),
            onPressed: () => Navigator.of(context).pop(),
          ),
        ),
        body: _loading
            ? const Center(child: CircularProgressIndicator(color: ConveeColors.primary))
            : _buildPayslipsTab(),
      );
    }

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
          ? const Center(child: CircularProgressIndicator(color: ConveeColors.primary))
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
                  final roll = s['studentRollNo'] ?? s['rollNo'] ?? 'STU-100$i';
                  final header = s['feeHeader']?.toString() ?? 'Tuition Fee';
                  final amount = s['totalAmount'] ?? s['amount'] ?? 50000;
                  final status = (s['status'] ?? 'PAID').toString().toUpperCase();

                  Color statusColor = ConveeColors.emerald;
                  if (status == 'OVERDUE') statusColor = ConveeColors.destructive;
                  if (status == 'PARTIAL' || status == 'PENDING') statusColor = ConveeColors.amber;

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
                              Text('$header • Roll: $roll', style: const TextStyle(color: ConveeColors.textMuted, fontSize: 11)),
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
                final month = p['month'] != null ? '${p['month']} ${p['year'] ?? ''}'.trim() : 'Current Term';
                final basic = (p['basicPay'] as num?)?.toDouble() ?? 45000.0;
                final hra = (p['allowances'] as num?)?.toDouble() ?? (p['hra'] as num?)?.toDouble() ?? 15000.0;
                final deductions = (p['deductions'] as num?)?.toDouble() ?? 6000.0;
                final net = (p['netSalary'] as num?)?.toDouble() ?? (p['netPayable'] as num?)?.toDouble() ?? (basic + hra - deductions);
                final status = (p['status'] ?? 'DISBURSED').toString().toUpperCase();

                Color statusColor = status == 'DISBURSED' ? ConveeColors.emerald : ConveeColors.amber;
                Color statusBg = status == 'DISBURSED' ? ConveeColors.emeraldLight : ConveeColors.amber.withOpacity(0.15);

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
                            decoration: BoxDecoration(color: statusBg, borderRadius: BorderRadius.circular(6)),
                            child: Text(status, style: TextStyle(color: statusColor, fontSize: 10, fontWeight: FontWeight.bold)),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Basic Pay + Allowances', style: TextStyle(color: ConveeColors.textSecondary, fontSize: 13)),
                          Text('₹${(basic + hra).toStringAsFixed(0)}', style: const TextStyle(color: ConveeColors.text, fontSize: 13)),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Statutory Deductions (PF/Tax)', style: TextStyle(color: ConveeColors.textSecondary, fontSize: 13)),
                          Text('-₹${deductions.toStringAsFixed(0)}', style: const TextStyle(color: ConveeColors.destructive, fontSize: 13)),
                        ],
                      ),
                      const Divider(color: ConveeColors.border, height: 20),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Net Salary Disbursed', style: TextStyle(fontWeight: FontWeight.bold, color: ConveeColors.text, fontSize: 14)),
                          Text('₹${net.toStringAsFixed(0)}', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: ConveeColors.emerald)),
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
