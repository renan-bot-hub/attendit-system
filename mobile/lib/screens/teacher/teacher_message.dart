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

  void sendMessage(String text) {
    ChatService.sendTeacherMessage(text);
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

  Widget buildMessage(Map<String, dynamic> msg) {
    final bool isBot = msg["isBot"] == true;
    final bool isOption = msg["isOption"] == true;

    return Align(
      alignment: isBot ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 5),
        padding: const EdgeInsets.all(12),
        constraints: const BoxConstraints(maxWidth: 300),
        decoration: BoxDecoration(
          color: isOption
              ? Colors.white70
              : isBot
                  ? Colors.white
                  : const Color(0xFFBDA4A4),
          borderRadius: BorderRadius.circular(15),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.08),
              blurRadius: 4,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Text(
          msg["text"],
          style: TextStyle(
            color: isBot || isOption ? Colors.black : Colors.white,
            fontSize: 15,
            fontStyle: isOption ? FontStyle.italic : FontStyle.normal,
          ),
        ),
      ),
    );
  }

  Widget buildChatBar() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(30),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 5,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: controller,
              decoration: const InputDecoration(
                hintText: "Teacher message...",
                border: InputBorder.none,
              ),
              onSubmitted: sendMessage,
            ),
          ),
          GestureDetector(
            onTap: () => sendMessage(controller.text),
            child: Container(
              padding: const EdgeInsets.all(10),
              decoration: const BoxDecoration(
                color: Color.fromARGB(255, 128, 36, 36),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.send,
                color: Colors.white,
                size: 20,
              ),
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
          Expanded(
            child: Container(
              decoration: const BoxDecoration(
                color: Color(0xFFF5F5F5),
                borderRadius: BorderRadius.vertical(top: Radius.circular(25)),
              ),
              child: Column(
                children: [
                  Expanded(
                    child: ValueListenableBuilder(
                      valueListenable: ChatService.messages,
                      builder: (context, chatMessages, _) {
                        final messages =
                            chatMessages.map((message) => message.toMap()).toList();

                        scrollToBottom();

                        return ListView.builder(
                          controller: scrollController,
                          padding: const EdgeInsets.all(15),
                          itemCount: messages.length,
                          itemBuilder: (context, index) {
                            return buildMessage(messages[index]);
                          },
                        );
                      },
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(12),
                    child: buildChatBar(),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}