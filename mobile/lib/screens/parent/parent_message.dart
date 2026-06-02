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
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            "Please wait for the teacher to start or reopen the conversation first.",
          ),
          backgroundColor: maroon,
        ),
      );
      return;
    }

    ChatService.sendParentMessage(cleanText);
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

  Widget buildLockedState() {
    return const Center(
      child: Padding(
        padding: EdgeInsets.all(24),
        child: Text(
          "Conversation Locked\n\nParents cannot send the first message. Please wait for the teacher to start the conversation.",
          textAlign: TextAlign.center,
          style: TextStyle(
            color: Colors.white,
            fontSize: 16,
            height: 1.5,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }

  Widget buildMessage(Map<String, dynamic> msg) {
    if (msg["teacherOnly"] == true) return const SizedBox.shrink();

    final bool isTeacher = msg["isTeacher"] == true;

    return Align(
      alignment: isTeacher ? Alignment.centerLeft : Alignment.centerRight,
      child: Container(
        constraints: const BoxConstraints(maxWidth: 280),
        margin: const EdgeInsets.symmetric(vertical: 6),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isTeacher ? Colors.white : const Color(0xFFFFEDED),
          borderRadius: BorderRadius.circular(15),
        ),
        child: Text(
          isTeacher ? "Teacher: ${msg["text"]}" : msg["text"] ?? "",
          style: const TextStyle(
            color: Colors.black,
            fontSize: 14,
            height: 1.4,
          ),
        ),
      ),
    );
  }

  Widget buildChatBar(bool isEnabled) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
      ),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: controller,
              enabled: isEnabled,
              decoration: InputDecoration(
                hintText: isEnabled
                    ? "Type your reply..."
                    : "Waiting for teacher message...",
                border: InputBorder.none,
              ),
              onSubmitted: isEnabled ? sendMessage : null,
            ),
          ),
          IconButton(
            icon: Icon(
              Icons.send,
              color: isEnabled ? maroon : Colors.black26,
            ),
            onPressed:
                isEnabled ? () => sendMessage(controller.text) : null,
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