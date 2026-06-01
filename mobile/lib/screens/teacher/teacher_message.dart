import 'package:flutter/material.dart';

class TeacherMessage extends StatefulWidget {
  const TeacherMessage({super.key});

  @override
  State<TeacherMessage> createState() => _TeacherMessageState();
}

class _TeacherMessageState extends State<TeacherMessage> {
  final TextEditingController controller = TextEditingController();

  final ScrollController scrollController = ScrollController();

  List<Map<String, dynamic>> messages = [
    {
      "text": "Parent selected: Get Started",
      "isBot": false,
      "isOption": true,
    },
    {
      "text":
          "Hi! I'm AttendBot, your virtual assistant. How can I help you today?",
      "isBot": true,
    },
    {
      "text": "Parent selected: Homeroom Schedule",
      "isBot": false,
      "isOption": true,
    },
    {
      "text": "Homeroom is scheduled Monday to Friday at 7:30 AM.",
      "isBot": true,
    },
    {
      "text": "Parent selected: Justify Absence",
      "isBot": false,
      "isOption": true,
    },
    {
      "text":
          "You may submit an excuse letter through the system or inform the adviser.",
      "isBot": true,
    },
  ];

  void selectOption(String option) {
    setState(() {
      messages.add({
        "text": "Parent selected: $option",
        "isBot": false,
        "isOption": true,
      });
    });

    scrollToBottom();

    Future.delayed(const Duration(milliseconds: 400), () {
      setState(() {
        messages.add({
          "text": getBotReply(option),
          "isBot": true,
        });
      });

      scrollToBottom();
    });
  }

  String getBotReply(String input) {
    final text = input.toLowerCase();

    if (text.contains("homeroom")) {
      return "Homeroom is every Monday to Friday at 7:30 AM.";
    }

    if (text.contains("rules")) {
      return "Students must log attendance before class and follow school monitoring rules.";
    }

    if (text.contains("adviser")) {
      return "You can contact the adviser during school hours or through the system.";
    }

    if (text.contains("absence")) {
      return "Submit an excuse letter or inform the adviser for validation.";
    }

    return "Your request has been recorded.";
  }

  void sendMessage(String text) {
    if (text.trim().isEmpty) return;

    setState(() {
      messages.add({
        "text": "Teacher: ${text.trim()}",
        "isBot": true,
        "isTeacher": true,
      });
    });

    controller.clear();
    scrollToBottom();
  }

  void scrollToBottom() {
    Future.delayed(const Duration(milliseconds: 100), () {
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
            onTap: () {
              sendMessage(controller.text);
            },
            child: Container(
              padding: const EdgeInsets.all(10),
              decoration: const BoxDecoration(
                color: Color.fromARGB(255, 255, 255, 255),
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
      color: const Color.fromARGB(255, 255, 255, 255),
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
                    child: ListView.builder(
                      controller: scrollController,
                      padding: const EdgeInsets.all(15),
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
              ),
            ),
          ),
        ],
      ),
    );
  }
}
