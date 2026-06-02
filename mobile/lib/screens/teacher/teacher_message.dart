import 'package:flutter/material.dart';
import '../../services/chat_service.dart';

class TeacherMessage extends StatefulWidget {
  const TeacherMessage({super.key});

  @override
  State<TeacherMessage> createState() => _TeacherMessageState();
}

class _TeacherMessageState extends State<TeacherMessage> {
  final TextEditingController controller = TextEditingController();
  final ScrollController scrollController = ScrollController();

  static const Color maroon = Color.fromARGB(255, 128, 36, 36);

  bool _isTeacherMessage(Map<String, dynamic> msg) {
    final role = (msg["role"] ?? msg["senderRole"] ?? msg["sender"] ?? "")
        .toString()
        .toLowerCase()
        .trim();

    return role == "teacher" || msg["isTeacher"] == true;
  }

  void sendMessage(String text) {
    final cleanText = text.trim();

    if (cleanText.isEmpty) return;

    ChatService.sendTeacherMessage(cleanText);
    controller.clear();
    scrollToBottom();
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

  Widget buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24),
        child: Container(
          padding: const EdgeInsets.all(22),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(22),
            border: Border.all(
              color: maroon.withOpacity(0.18),
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.08),
                blurRadius: 12,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: const Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.forum_outlined,
                size: 58,
                color: maroon,
              ),
              SizedBox(height: 14),
              Text(
                "Start a Conversation",
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: maroon,
                ),
              ),
              SizedBox(height: 10),
              Text(
                "Parents cannot send the first message. As the teacher, you may start the conversation so the parent can reply.",
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 14,
                  height: 1.5,
                  color: Colors.black54,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget buildHeaderNotice() {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.fromLTRB(12, 12, 12, 4),
      padding: const EdgeInsets.all(13),
      decoration: BoxDecoration(
        color: maroon.withOpacity(0.08),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: maroon.withOpacity(0.18),
        ),
      ),
      child: const Row(
        children: [
          Icon(
            Icons.verified_user_outlined,
            color: maroon,
          ),
          SizedBox(width: 10),
          Expanded(
            child: Text(
              "Teacher access: You are allowed to send the first message to start the conversation with the parent.",
              style: TextStyle(
                color: Colors.black87,
                fontWeight: FontWeight.w600,
                fontSize: 13,
                height: 1.4,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget buildMessage(Map<String, dynamic> msg) {
    final bool isTeacher = _isTeacherMessage(msg);

    return Align(
      alignment: isTeacher ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        constraints: const BoxConstraints(maxWidth: 285),
        margin: const EdgeInsets.symmetric(vertical: 6),
        padding: const EdgeInsets.symmetric(
          vertical: 12,
          horizontal: 14,
        ),
        decoration: BoxDecoration(
          color: isTeacher ? maroon : Colors.white,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(16),
            topRight: const Radius.circular(16),
            bottomLeft: Radius.circular(isTeacher ? 16 : 4),
            bottomRight: Radius.circular(isTeacher ? 4 : 16),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.08),
              blurRadius: 6,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Text(
          msg["text"] ?? "",
          style: TextStyle(
            color: isTeacher ? Colors.white : Colors.black87,
            fontSize: 14,
            height: 1.4,
          ),
        ),
      ),
    );
  }

  Widget buildChatBar() {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: 10,
        vertical: 8,
      ),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(26),
        border: Border.all(
          color: maroon.withOpacity(0.15),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.10),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          const SizedBox(width: 6),

          Expanded(
            child: TextField(
              controller: controller,
              decoration: const InputDecoration(
                hintText: "Message the parent...",
                border: InputBorder.none,
                hintStyle: TextStyle(
                  color: Colors.black38,
                  fontSize: 14,
                ),
              ),
              onSubmitted: sendMessage,
            ),
          ),

          Container(
            decoration: const BoxDecoration(
              color: maroon,
              shape: BoxShape.circle,
            ),
            child: IconButton(
              icon: const Icon(
                Icons.send,
                color: Colors.white,
                size: 20,
              ),
              onPressed: () => sendMessage(controller.text),
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
      color: Colors.white,
      child: Column(
        children: [
          buildHeaderNotice(),

          Expanded(
            child: Container(
              margin: const EdgeInsets.fromLTRB(0, 8, 0, 0),
              decoration: const BoxDecoration(
                color: Color(0xFFF5F5F5),
                borderRadius: BorderRadius.vertical(
                  top: Radius.circular(25),
                ),
              ),
              child: ValueListenableBuilder(
                valueListenable: ChatService.messages,
                builder: (context, chatMessages, _) {
                  final messages =
                      chatMessages.map((message) => message.toMap()).toList();

                  if (messages.isNotEmpty) {
                    scrollToBottom();
                  }

                  return Column(
                    children: [
                      Expanded(
                        child: messages.isEmpty
                            ? buildEmptyState()
                            : ListView.builder(
                                controller: scrollController,
                                padding:
                                    const EdgeInsets.fromLTRB(15, 15, 15, 12),
                                itemCount: messages.length,
                                itemBuilder: (context, index) {
                                  return buildMessage(messages[index]);
                                },
                              ),
                      ),

                      Padding(
                        padding: const EdgeInsets.all(12),
                        child: buildChatBar(),
                      ),
                    ],
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }
}