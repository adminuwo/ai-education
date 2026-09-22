import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../constants/theme.dart';
import '../services/api_service.dart';
import '../services/language_service.dart';

class ChatChannelsScreen extends StatefulWidget {
  final Map<String, dynamic>? userData;
  final Map<String, dynamic>? orgData;

  const ChatChannelsScreen({Key? key, this.userData, this.orgData}) : super(key: key);

  @override
  State<ChatChannelsScreen> createState() => _ChatChannelsScreenState();
}

class _ChatChannelsScreenState extends State<ChatChannelsScreen> {
  bool _loading = true;
  List<dynamic> _channels = [];
  Map<String, dynamic>? _selectedChannel;

  // Active Chat State
  List<dynamic> _messages = [];
  bool _loadingMessages = false;
  final TextEditingController _msgController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _loadChannels();
  }

  @override
  void dispose() {
    _msgController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _loadChannels() async {
    setState(() => _loading = true);
    final orgId = widget.orgData?['id']?.toString() ?? '';
    final channels = await ApiService.getChannels(orgId);
    if (mounted) {
      setState(() {
        _channels = channels;
        _loading = false;
      });
    }
  }

  Future<void> _openChannel(Map<String, dynamic> ch) async {
    setState(() {
      _selectedChannel = ch;
      _loadingMessages = true;
      _messages = [];
    });

    final chId = ch['id']?.toString() ?? '';
    final msgs = await ApiService.getMessages(chId);
    if (mounted) {
      setState(() {
        _messages = msgs;
        _loadingMessages = false;
      });
      _scrollToBottom();
    }
  }

  Future<void> _sendMessage() async {
    final text = _msgController.text.trim();
    if (text.isEmpty || _selectedChannel == null) return;
    final chId = _selectedChannel!['id']?.toString() ?? '';
    _msgController.clear();

    final res = await ApiService.sendMessage(chId, text);
    if (res != null && mounted) {
      setState(() {
        _messages.add(res);
      });
      _scrollToBottom();
    }
  }

  void _scrollToBottom() {
    Future.delayed(const Duration(milliseconds: 100), () {
      if (_scrollController.hasClients) {
        _scrollController.jumpTo(_scrollController.position.maxScrollExtent);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ConveeColors.background,
      appBar: AppBar(
        title: Text(_selectedChannel != null
            ? '# ${_selectedChannel!['name'] ?? 'Channel'}'
            : LanguageService.tr('nav.channels', fallback: 'Messages & Channels')),
        leading: _selectedChannel != null
            ? IconButton(
                icon: const Icon(Icons.arrow_back),
                onPressed: () => setState(() => _selectedChannel = null),
              )
            : null,
      ),
      body: _selectedChannel != null ? _buildChatRoomView() : _buildChannelsListView(),
    );
  }

  Widget _buildChannelsListView() {
    if (_loading) {
      return const Center(child: ActivityIndicator(color: ConveeColors.primary));
    }
    if (_channels.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.chat_bubble_outline, size: 48, color: ConveeColors.textMuted),
            const SizedBox(height: 12),
            const Text('No channels available yet.', style: TextStyle(color: ConveeColors.textSecondary)),
            const SizedBox(height: 12),
            TextButton(onPressed: _loadChannels, child: const Text('Refresh', style: TextStyle(color: ConveeColors.primary))),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadChannels,
      color: ConveeColors.primary,
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: _channels.length,
        separatorBuilder: (_, __) => const SizedBox(height: 8),
        itemBuilder: (ctx, i) {
          final ch = _channels[i];
          final name = ch['name'] ?? 'General';
          final desc = ch['description'] ?? 'Classroom & campus discussion';
          final isPrivate = ch['isPrivate'] == true;

          return InkWell(
            onTap: () => _openChannel(ch),
            borderRadius: BorderRadius.circular(12),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              decoration: BoxDecoration(
                color: ConveeColors.card,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: ConveeColors.border),
              ),
              child: Row(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: ConveeColors.cardSecondary,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: ConveeColors.border),
                    ),
                    alignment: Alignment.center,
                    child: Icon(isPrivate ? Icons.lock_outline : Icons.tag, color: ConveeColors.primary, size: 20),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(name, style: const TextStyle(color: ConveeColors.text, fontWeight: FontWeight.bold, fontSize: 15)),
                        const SizedBox(height: 3),
                        Text(desc, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: ConveeColors.textMuted, fontSize: 12)),
                      ],
                    ),
                  ),
                  const Icon(Icons.chevron_right, color: ConveeColors.textMuted, size: 18),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildChatRoomView() {
    final myId = widget.userData?['id']?.toString() ?? '';

    return Column(
      children: [
        Expanded(
          child: _loadingMessages
              ? const Center(child: ActivityIndicator(color: ConveeColors.primary))
              : _messages.isEmpty
                  ? const Center(child: Text('No messages here yet. Say hello!', style: TextStyle(color: ConveeColors.textMuted)))
                  : ListView.builder(
                      controller: _scrollController,
                      padding: const EdgeInsets.all(16),
                      itemCount: _messages.length,
                      itemBuilder: (ctx, i) {
                        final m = _messages[i];
                        final senderId = m['senderId']?.toString() ?? m['sender']?['id']?.toString() ?? '';
                        final isMe = senderId == myId;
                        final senderName = m['sender']?['fullName'] ?? 'User';
                        final content = m['content'] ?? '';
                        final timeStr = m['createdAt'] != null
                            ? DateFormat('hh:mm a').format(DateTime.parse(m['createdAt']))
                            : '';

                        return Align(
                          alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
                          child: Container(
                            margin: const EdgeInsets.only(bottom: 10),
                            constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                            decoration: BoxDecoration(
                              color: isMe ? ConveeColors.primary : ConveeColors.cardSecondary,
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(color: isMe ? ConveeColors.primary : ConveeColors.border),
                            ),
                            child: Column(
                              crossAxisAlignment: isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
                              children: [
                                if (!isMe) ...[
                                  Text(senderName, style: const TextStyle(color: ConveeColors.amber, fontWeight: FontWeight.bold, fontSize: 11)),
                                  const SizedBox(height: 2),
                                ],
                                Text(
                                  content,
                                  style: TextStyle(color: isMe ? Colors.black : ConveeColors.text, fontSize: 14),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  timeStr,
                                  style: TextStyle(color: isMe ? Colors.black54 : ConveeColors.textMuted, fontSize: 10),
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
        ),

        // Input Bar
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          decoration: BoxDecoration(
            color: ConveeColors.card,
            border: Border(top: BorderSide(color: ConveeColors.border)),
          ),
          child: SafeArea(
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _msgController,
                    style: const TextStyle(color: ConveeColors.text, fontSize: 14),
                    decoration: InputDecoration(
                      hintText: 'Type a message...',
                      hintStyle: const TextStyle(color: ConveeColors.textMuted, fontSize: 14),
                      filled: true,
                      fillColor: ConveeColors.cardSecondary,
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(20), borderSide: BorderSide.none),
                    ),
                    onSubmitted: (_) => _sendMessage(),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  icon: const Icon(Icons.send, color: ConveeColors.primary),
                  onPressed: _sendMessage,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
