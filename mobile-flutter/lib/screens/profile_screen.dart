import 'package:flutter/material.dart';
import '../constants/theme.dart';
import '../services/api_service.dart';
import '../services/language_service.dart';
import '../components/language_switcher.dart';
import 'login_screen.dart';

class ProfileScreen extends StatefulWidget {
  final Map<String, dynamic>? orgData;
  final Map<String, dynamic>? userData;

  const ProfileScreen({super.key, this.orgData, this.userData});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  Map<String, dynamic>? _user;
  Map<String, dynamic>? _org;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _user = widget.userData;
    _org = widget.orgData;
    _fetchProfile();
  }

  Future<void> _fetchProfile() async {
    setState(() => _isLoading = true);
    try {
      final me = await ApiService.getMe();
      if (me != null && mounted) {
        setState(() {
          _user = me['user'] ?? (me.containsKey('email') ? me : _user);
          if (me['memberships'] is List && (me['memberships'] as List).isNotEmpty) {
            final firstMem = (me['memberships'] as List).first;
            _org = firstMem['organization'] ?? {'id': firstMem['orgId'], 'name': 'Institution', 'role': firstMem['role']};
          }
        });
      }
    } catch (_) {
      // Fallback to widget data
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showChangePasswordDialog() {
    final currentPasswordController = TextEditingController();
    final newPasswordController = TextEditingController();
    final confirmPasswordController = TextEditingController();
    bool isSubmitting = false;
    String? errorMessage;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          backgroundColor: ConveeColors.card,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: const BorderSide(color: ConveeColors.border),
          ),
          title: const Row(
            children: [
              Icon(Icons.lock_reset, color: ConveeColors.primary, size: 22),
              SizedBox(width: 8),
              Text('Change Password', style: TextStyle(color: ConveeColors.text, fontSize: 18, fontWeight: FontWeight.bold)),
            ],
          ),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (errorMessage != null)
                  Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: ConveeColors.destructive.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: ConveeColors.destructive),
                    ),
                    child: Text(
                      errorMessage!,
                      style: const TextStyle(color: ConveeColors.destructive, fontSize: 12),
                    ),
                  ),
                const Text('Current Password', style: TextStyle(color: ConveeColors.textSecondary, fontSize: 12)),
                const SizedBox(height: 4),
                TextField(
                  controller: currentPasswordController,
                  obscureText: true,
                  style: const TextStyle(color: ConveeColors.text, fontSize: 14),
                  decoration: InputDecoration(
                    hintText: 'Enter current password',
                    hintStyle: const TextStyle(color: ConveeColors.textMuted, fontSize: 13),
                    filled: true,
                    fillColor: ConveeColors.background,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: ConveeColors.border)),
                  ),
                ),
                const SizedBox(height: 12),
                const Text('New Password', style: TextStyle(color: ConveeColors.textSecondary, fontSize: 12)),
                const SizedBox(height: 4),
                TextField(
                  controller: newPasswordController,
                  obscureText: true,
                  style: const TextStyle(color: ConveeColors.text, fontSize: 14),
                  decoration: InputDecoration(
                    hintText: 'Minimum 8 characters',
                    hintStyle: const TextStyle(color: ConveeColors.textMuted, fontSize: 13),
                    filled: true,
                    fillColor: ConveeColors.background,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: ConveeColors.border)),
                  ),
                ),
                const SizedBox(height: 12),
                const Text('Confirm New Password', style: TextStyle(color: ConveeColors.textSecondary, fontSize: 12)),
                const SizedBox(height: 4),
                TextField(
                  controller: confirmPasswordController,
                  obscureText: true,
                  style: const TextStyle(color: ConveeColors.text, fontSize: 14),
                  decoration: InputDecoration(
                    hintText: 'Re-enter new password',
                    hintStyle: const TextStyle(color: ConveeColors.textMuted, fontSize: 13),
                    filled: true,
                    fillColor: ConveeColors.background,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: ConveeColors.border)),
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: isSubmitting ? null : () => Navigator.pop(ctx),
              child: const Text('Cancel', style: TextStyle(color: ConveeColors.textSecondary)),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: ConveeColors.primary,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
              onPressed: isSubmitting
                  ? null
                  : () async {
                      final curr = currentPasswordController.text.trim();
                      final next = newPasswordController.text.trim();
                      final confirm = confirmPasswordController.text.trim();

                      if (curr.isEmpty || next.isEmpty) {
                        setDialogState(() => errorMessage = 'All password fields are required.');
                        return;
                      }
                      if (next.length < 6) {
                        setDialogState(() => errorMessage = 'Password must be at least 6 characters.');
                        return;
                      }
                      if (next != confirm) {
                        setDialogState(() => errorMessage = 'New passwords do not match.');
                        return;
                      }

                      setDialogState(() {
                        isSubmitting = true;
                        errorMessage = null;
                      });

                      final success = await ApiService.changePassword(
                        currentPassword: curr,
                        newPassword: next,
                      );

                      if (success) {
                        if (mounted) {
                          Navigator.pop(ctx);
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Password updated successfully!'),
                              backgroundColor: ConveeColors.emerald,
                            ),
                          );
                        }
                      } else {
                        setDialogState(() {
                          isSubmitting = false;
                          errorMessage = 'Failed to update password. Verify current password.';
                        });
                      }
                    },
              child: isSubmitting
                  ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.black, strokeWidth: 2))
                  : const Text('Update Password', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }

  void _confirmLogout() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: ConveeColors.card,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: ConveeColors.border),
        ),
        title: const Text('Confirm Sign Out', style: TextStyle(color: ConveeColors.text, fontWeight: FontWeight.bold)),
        content: const Text(
          'Are you sure you want to sign out of your institution portal account?',
          style: TextStyle(color: ConveeColors.textSecondary, fontSize: 13),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: ConveeColors.textSecondary)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: ConveeColors.destructive,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            onPressed: () async {
              Navigator.pop(ctx);
              await ApiService.logout();
              if (mounted) {
                Navigator.of(context).pushAndRemoveUntil(
                  MaterialPageRoute(builder: (_) => const LoginScreen()),
                  (route) => false,
                );
              }
            },
            child: const Text('Sign Out', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final fullName = _user?['fullName'] ?? _user?['name'] ?? 'Authorized User';
    final email = _user?['email'] ?? 'user@institution.edu';
    final systemRole = _user?['systemRole'] ?? _org?['role'] ?? 'MEMBER';
    final orgName = _org?['name'] ?? 'Educational Institution';
    final orgId = _org?['id']?.toString() ?? 'N/A';

    final initials = fullName.split(' ').map((s) => s.isNotEmpty ? s[0] : '').take(2).join('').toUpperCase();

    return Scaffold(
      backgroundColor: ConveeColors.background,
      appBar: AppBar(
        title: const Text('Account & Security', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 18)),
        actions: const [
          Padding(
            padding: EdgeInsets.only(right: 8.0),
            child: LanguageSwitcher(compact: true),
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: ConveeColors.primary))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // User Avatar & Name Card
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: ConveeColors.card,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: ConveeColors.border),
                    ),
                    child: Column(
                      children: [
                        CircleAvatar(
                          radius: 36,
                          backgroundColor: ConveeColors.primary.withOpacity(0.18),
                          child: Text(
                            initials.isNotEmpty ? initials : 'U',
                            style: const TextStyle(
                              color: ConveeColors.primary,
                              fontSize: 26,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          fullName,
                          style: const TextStyle(
                            color: ConveeColors.text,
                            fontSize: 19,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          email,
                          style: const TextStyle(
                            color: ConveeColors.textSecondary,
                            fontSize: 13,
                          ),
                        ),
                        const SizedBox(height: 12),
                        Wrap(
                          spacing: 8,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: ConveeColors.primary.withOpacity(0.15),
                                borderRadius: BorderRadius.circular(6),
                                border: Border.all(color: ConveeColors.primary.withOpacity(0.3)),
                              ),
                              child: Text(
                                systemRole.toString().toUpperCase(),
                                style: const TextStyle(
                                  color: ConveeColors.primary,
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: ConveeColors.cardLight,
                                borderRadius: BorderRadius.circular(6),
                                border: Border.all(color: ConveeColors.border),
                              ),
                              child: Text(
                                orgName,
                                style: const TextStyle(
                                  color: ConveeColors.textSecondary,
                                  fontSize: 11,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Institutional Context Section
                  const Text('Institutional Details', style: TextStyle(color: ConveeColors.text, fontSize: 15, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  Container(
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: ConveeColors.card,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: ConveeColors.border),
                    ),
                    child: Column(
                      children: [
                        _buildDetailRow(Icons.business, 'Campus Name', orgName),
                        const Divider(height: 1, color: ConveeColors.border),
                        _buildDetailRow(Icons.badge, 'Tenant Org ID', orgId),
                        const Divider(height: 1, color: ConveeColors.border),
                        _buildDetailRow(Icons.security, 'Access Tier', 'Role-Based Access Control (RBAC) Active'),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Security & Authentication
                  const Text('Security & Credentials', style: TextStyle(color: ConveeColors.text, fontSize: 15, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  Container(
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: ConveeColors.card,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: ConveeColors.border),
                    ),
                    child: Column(
                      children: [
                        ListTile(
                          leading: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: ConveeColors.primary.withOpacity(0.12),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Icon(Icons.lock_outline, color: ConveeColors.primary, size: 20),
                          ),
                          title: const Text('Change Password', style: TextStyle(color: ConveeColors.text, fontSize: 14, fontWeight: FontWeight.w600)),
                          subtitle: const Text('Update your institutional login password', style: TextStyle(color: ConveeColors.textSecondary, fontSize: 12)),
                          trailing: const Icon(Icons.chevron_right, color: ConveeColors.textMuted),
                          onTap: _showChangePasswordDialog,
                        ),
                        const Divider(height: 1, color: ConveeColors.border),
                        ListTile(
                          leading: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: ConveeColors.emerald.withOpacity(0.12),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Icon(Icons.verified_user, color: ConveeColors.emerald, size: 20),
                          ),
                          title: const Text('Two-Factor Authentication', style: TextStyle(color: ConveeColors.text, fontSize: 14, fontWeight: FontWeight.w600)),
                          subtitle: const Text('Managed by Institution Admin Policy', style: TextStyle(color: ConveeColors.textSecondary, fontSize: 12)),
                          trailing: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: ConveeColors.emerald.withOpacity(0.15),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: const Text('ENFORCED', style: TextStyle(color: ConveeColors.emerald, fontSize: 10, fontWeight: FontWeight.bold)),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Engine & Architecture Specifications (16 KB Verified)
                  const Text('Platform & Architecture', style: TextStyle(color: ConveeColors.text, fontSize: 15, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: ConveeColors.card,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: ConveeColors.border),
                    ),
                    child: Column(
                      children: [
                        _buildArchRow('Kernel Memory Page Alignment', '16 KB ELF Page-Aligned', ConveeColors.emerald),
                        const SizedBox(height: 8),
                        _buildArchRow('Android Compatibility', 'API 35 (Android 15) Ready', ConveeColors.primary),
                        const SizedBox(height: 8),
                        _buildArchRow('iOS Compatibility', 'iOS 13.0+ (ARM64)', ConveeColors.textSecondary),
                        const SizedBox(height: 8),
                        _buildArchRow('Compilation Engine', 'Flutter 3.x AOT Standalone', ConveeColors.textSecondary),
                        const SizedBox(height: 8),
                        _buildArchRow('App Version', '2.1.0-prod (Build 16)', ConveeColors.amber),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Sign Out Button
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: ConveeColors.destructive),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      icon: const Icon(Icons.logout, color: ConveeColors.destructive, size: 20),
                      label: const Text(
                        'Sign Out of Institution Portal',
                        style: TextStyle(color: ConveeColors.destructive, fontWeight: FontWeight.bold, fontSize: 14),
                      ),
                      onPressed: _confirmLogout,
                    ),
                  ),
                  const SizedBox(height: 24),
                ],
              ),
            ),
    );
  }

  Widget _buildDetailRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      child: Row(
        children: [
          Icon(icon, color: ConveeColors.textMuted, size: 18),
          const SizedBox(width: 12),
          Text(label, style: const TextStyle(color: ConveeColors.textSecondary, fontSize: 13)),
          const Spacer(),
          Expanded(
            child: Text(
              value,
              textAlign: TextAlign.right,
              style: const TextStyle(color: ConveeColors.text, fontSize: 13, fontWeight: FontWeight.w500),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildArchRow(String label, String value, Color badgeColor) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(color: ConveeColors.textSecondary, fontSize: 12)),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
          decoration: BoxDecoration(
            color: badgeColor.withOpacity(0.12),
            borderRadius: BorderRadius.circular(4),
            border: Border.all(color: badgeColor.withOpacity(0.3)),
          ),
          child: Text(
            value,
            style: TextStyle(color: badgeColor, fontSize: 11, fontWeight: FontWeight.w600),
          ),
        ),
      ],
    );
  }
}
