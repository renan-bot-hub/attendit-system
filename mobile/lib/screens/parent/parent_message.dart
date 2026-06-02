import 'package:flutter/material.dart';
import '../../services/chat_service.dart';

class ParentMessage extends StatefulWidget {
  const ParentMessage({super.key});

  @override
  State<ParentMessage> createState() => _ParentMessageState();
}

class _ParentMessageState extends State<ParentMessage> {
  final TextEditingController controller = TextEditingController();
  final ScrollController scrollController = ScrollController();

  static const Color maroon = Color.fromARGB(255, 128, 36, 36);

  void sendMessage(String text) {
    final cleanText = text.trim();
    if (cleanText.isEmpty) return;

    if (ChatService.isParentLocked) {
      showLockedMessage();
      return;
    }

    ChatService.sendParentMessage(cleanText);
    controller.clear();
    scrollToBottom();
  }

  void showLockedMessage() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text(
          "Please wait for the teacher to start or reopen the conversation first.",
        ),
        backgroundColor: maroon,
      ),
    );
  }

  void sendMockAttachment({
    required String fileName,
    required String fileType,
    required String fileSize,
    required String icon,
  }) {
    if (ChatService.isParentLocked) {
      showLockedMessage();
      return;
    }

    ChatService.sendAttachmentMessage(
      "$icon $fileType uploaded\n$fileName\nSize: $fileSize",
    );

    scrollToBottom();
  }

  void showAttachmentOptions() {
    if (ChatService.isParentLocked) {
      showLockedMessage();
      return;
    }

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
      ),
      builder: (context) {
        return Padding(
          padding: const EdgeInsets.fromLTRB(16, 14, 16, 22),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 45,
                height: 5,
                margin: const EdgeInsets.only(bottom: 18),
                decoration: BoxDecoration(
                  color: Colors.black26,
                  borderRadius: BorderRadius.circular(30),
                ),
              ),
              const Row(
                children: [
                  Icon(Icons.attach_file, color: maroon),
                  SizedBox(width: 10),
                  Text(
                    "Upload Attachment",
                    style: TextStyle(
                      color: Colors.black,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              _attachmentOption(
                icon: Icons.description,
                title: "Excuse Letter",
                subtitle: "Upload Excuse_Letter.pdf",
                onTap: () {
                  Navigator.pop(context);
                  sendMockAttachment(
                    icon: "📄",
                    fileType: "Excuse Letter",
                    fileName: "Excuse_Letter.pdf",
                    fileSize: "245 KB",
                  );
                },
              ),
              _attachmentOption(
                icon: Icons.local_hospital,
                title: "Medical Certificate",
                subtitle: "Upload Medical_Certificate.pdf",
                onTap: () {
                  Navigator.pop(context);
                  sendMockAttachment(
                    icon: "🏥",
                    fileType: "Medical Certificate",
                    fileName: "Medical_Certificate.pdf",
                    fileSize: "318 KB",
                  );
                },
              ),
              _attachmentOption(
                icon: Icons.image,
                title: "Photo Proof",
                subtitle: "Upload Attendance_Proof.jpg",
                onTap: () {
                  Navigator.pop(context);
                  sendMockAttachment(
                    icon: "🖼️",
                    fileType: "Photo Proof",
                    fileName: "Attendance_Proof.jpg",
                    fileSize: "1.2 MB",
                  );
                },
              ),
              _attachmentOption(
                icon: Icons.folder,
                title: "Other Document",
                subtitle: "Upload Supporting_Document.docx",
                onTap: () {
                  Navigator.pop(context);
                  sendMockAttachment(
                    icon: "📎",
                    fileType: "Supporting Document",
                    fileName: "Supporting_Document.docx",
                    fileSize: "156 KB",
                  );
                },
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _attachmentOption({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF7F7),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: maroon.withOpacity(0.18)),
      ),
      child: ListTile(
        onTap: onTap,
        leading: CircleAvatar(
          backgroundColor: maroon,
          child: Icon(icon, color: Colors.white, size: 22),
        ),
        title: Text(
          title,
          style: const TextStyle(
            color: maroon,
            fontWeight: FontWeight.bold,
          ),
        ),
        subtitle: Text(
          subtitle,
          style: const TextStyle(
            color: Colors.black54,
            fontSize: 12,
          ),
        ),
        trailing: const Icon(
          Icons.arrow_forward_ios,
          size: 15,
          color: Colors.black45,
        ),
      ),
    );
  }

  void scrollToBottom() {
    Future.delayed(const Duration(milliseconds: 150), () {
      if (scrollController.hasClients) {
        scrollController.animateTo(
          scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Widget buildLockedState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.all(22),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.12),
            borderRadius: BorderRadius.circular(22),
            border: Border.all(color: Colors.white.withOpacity(0.20)),
          ),
          child: const Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.lock_outline, color: Colors.white, size: 52),
              SizedBox(height: 14),
              Text(
                "Conversation Locked",
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 21,
                  fontWeight: FontWeight.bold,
                ),
              ),
              SizedBox(height: 10),
              Text(
                "Parents cannot send the first message. Please wait for the teacher to start the conversation.",
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Colors.white70,
                  fontSize: 14,
                  height: 1.5,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget buildMessage(Map<String, dynamic> msg) {
    if (msg["teacherOnly"] == true) return const SizedBox.shrink();

    final bool isTeacher = msg["isTeacher"] == true;
    final String text = msg["text"] ?? "";
    final bool isAttachment = text.contains("uploaded");

    return Align(
      alignment: isTeacher ? Alignment.centerLeft : Alignment.centerRight,
      child: Container(
        constraints: const BoxConstraints(maxWidth: 285),
        margin: const EdgeInsets.symmetric(vertical: 6),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isTeacher ? Colors.white : const Color(0xFFFFEDED),
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(15),
            topRight: const Radius.circular(15),
            bottomLeft: Radius.circular(isTeacher ? 4 : 15),
            bottomRight: Radius.circular(isTeacher ? 15 : 4),
          ),
        ),
        child: isAttachment && !isTeacher
            ? _attachmentBubble(text)
            : Text(
                isTeacher ? "Teacher: $text" : text,
                style: const TextStyle(
                  color: Colors.black,
                  fontSize: 14,
                  height: 1.4,
                ),
              ),
      ),
    );
  }

  Widget _attachmentBubble(String text) {
    final lines = text.split("\n");

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Icon(Icons.insert_drive_file, color: maroon, size: 28),
        const SizedBox(width: 10),
        Expanded(
          child: Text(
            lines.join("\n"),
            style: const TextStyle(
              color: Colors.black,
              fontSize: 14,
              height: 1.4,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ],
    );
  }

  Widget buildChatBar(bool isEnabled) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(26),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.10),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        children: [
          IconButton(
            tooltip: "Attach file",
            icon: Icon(
              Icons.attach_file,
              color: isEnabled ? maroon : Colors.black26,
            ),
            onPressed: isEnabled ? showAttachmentOptions : showLockedMessage,
          ),
          Expanded(
            child: TextField(
              controller: controller,
              enabled: isEnabled,
              decoration: InputDecoration(
                hintText: isEnabled
                    ? "Type your reply..."
                    : "Waiting for teacher message...",
                border: InputBorder.none,
                hintStyle: const TextStyle(
                  color: Colors.black38,
                  fontSize: 14,
                ),
              ),
              onSubmitted: isEnabled ? sendMessage : null,
            ),
          ),
          Container(
            decoration: BoxDecoration(
              color: isEnabled ? maroon : Colors.black26,
              shape: BoxShape.circle,
            ),
            child: IconButton(
              tooltip: "Send message",
              icon: const Icon(Icons.send, color: Colors.white, size: 20),
              onPressed: isEnabled ? () => sendMessage(controller.text) : null,
            ),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    controller.dispose();
    scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      color: maroon,
      child: ValueListenableBuilder(
        valueListenable: ChatService.messages,
        builder: (context, chatMessages, _) {
          final messages = chatMessages
              .map((message) => message.toMap())
              .where((msg) => msg["teacherOnly"] != true)
              .toList();

          final bool isEnabled = !ChatService.isParentLocked;

          if (messages.isNotEmpty) scrollToBottom();

          return Column(
            children: [
              Expanded(
                child: messages.isEmpty
                    ? buildLockedState()
                    : ListView.builder(
                        controller: scrollController,
                        padding: const EdgeInsets.all(12),
                        itemCount: messages.length,
                        itemBuilder: (context, index) {
                          return buildMessage(messages[index]);
                        },
                      ),
              ),
              Padding(
                padding: const EdgeInsets.all(12),
                child: buildChatBar(isEnabled),
              ),
            ],
          );
        },
      ),
    );
  }
}