import 'package:flutter/material.dart';

class ParentMessage extends StatefulWidget {
  const ParentMessage({super.key});

  @override
  State<ParentMessage> createState() => _ParentMessageState();
}

class _ParentMessageState extends State<ParentMessage> {
  final TextEditingController controller = TextEditingController();

  final ScrollController scrollController = ScrollController();

  List<Map<String, dynamic>> messages = [
    {
      "text":
          "Hi! I'm AttendBot, your virtual assistant. How can I help you today?",
      "isBot": true,
    }
  ];

  final List<String> quickOptions = [
    "Get Started",
    "Homeroom Schedule",
    "Rules for Monitoring",
    "Talk To The Adviser",
    "Justify Absence",
  ];

  void sendMessage(String text) {
    if (text.trim().isEmpty) return;

    setState(() {
      messages.add({
        "text": text,
        "isBot": false,
      });
    });

    controller.clear();

    scrollToBottom();

    Future.delayed(const Duration(milliseconds: 500), () {
      setState(() {
        messages.add({
          "text":
              "Your request regarding \"$text\" has been received by the teacher.",
          "isBot": true,
        });
      });

      scrollToBottom();
    });
  }

  void showAttachmentOptions() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(20),
        ),
      ),
      builder: (context) {
        return Wrap(
          children: [
            ListTile(
              leading: const Icon(Icons.attach_file),
              title: const Text("Attach a File"),
              onTap: () {
                Navigator.pop(context);

                setState(() {
                  messages.add({
                    "text": "📎 Parent attached a file for excuse letter.",
                    "isBot": false,
                  });
                });

                scrollToBottom();
              },
            ),
            ListTile(
              leading: const Icon(Icons.image),
              title: const Text("Select a Photo"),
              onTap: () {
                Navigator.pop(context);

                setState(() {
                  messages.add({
                    "text": "🖼️ Parent selected a photo as proof.",
                    "isBot": false,
                  });
                });

                scrollToBottom();
              },
            ),
          ],
        );
      },
    );
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

  Widget buildOptionButton(String text) {
    return GestureDetector(
      onTap: () => sendMessage(text),
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.symmetric(
          vertical: 12,
          horizontal: 15,
        ),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(15),
        ),
        child: Row(
          children: [
            const Icon(
              Icons.chat_bubble_outline,
              color: Colors.black,
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                text,
                style: const TextStyle(
                  color: Colors.black,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget buildMessage(Map<String, dynamic> msg) {
    return Align(
      alignment: msg["isBot"] ? Alignment.centerLeft : Alignment.centerRight,
      child: Container(
        constraints: const BoxConstraints(maxWidth: 280),
        margin: const EdgeInsets.symmetric(vertical: 5),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: msg["isBot"]
              ? const Color.fromARGB(255, 255, 255, 255)
              : const Color.fromARGB(255, 255, 255, 255),
          borderRadius: BorderRadius.circular(15),
        ),
        child: Text(
          msg["text"],
          style: TextStyle(
            color: msg["isBot"]
                ? const Color.fromARGB(255, 0, 0, 0)
                : const Color.fromARGB(255, 0, 0, 0),
          ),
        ),
      ),
    );
  }

  Widget buildChatBar() {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        children: [
          IconButton(
            icon: const Icon(
              Icons.attach_file,
              color: Color.fromARGB(255, 0, 0, 0),
            ),
            onPressed: showAttachmentOptions,
          ),
          Expanded(
            child: TextField(
              controller: controller,
              decoration: const InputDecoration(
                hintText: "Type your message...",
                border: InputBorder.none,
              ),
              onSubmitted: sendMessage,
            ),
          ),
          IconButton(
            icon: const Icon(
              Icons.send,
              color: Color.fromARGB(255, 0, 0, 0),
            ),
            onPressed: () {
              sendMessage(controller.text);
            },
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      color: const Color.fromARGB(255, 128, 36, 36),
      child: Column(
        children: [
          Expanded(
            child: ListView.builder(
              controller: scrollController,
              padding: const EdgeInsets.all(12),
              itemCount: messages.length,
              itemBuilder: (context, index) {
                return buildMessage(messages[index]);
              },
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: 12,
            ),
            child: Column(
              children: quickOptions
                  .map((option) => buildOptionButton(option))
                  .toList(),
            ),
          ),
          const SizedBox(height: 10),
          Padding(
            padding: const EdgeInsets.all(12),
            child: buildChatBar(),
          ),
        ],
      ),
    );
  }
}
