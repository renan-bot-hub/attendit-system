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

  final List<String> allQuickOptions = [
    "Get Started",
    "Homeroom Schedule",
    "Rules for Monitoring",
    "Talk To The Adviser",
    "Justify Absence",
  ];

  final Set<String> selectedOptions = {};

  List<String> get availableQuickOptions {
    return allQuickOptions.where((option) {
      return !selectedOptions.contains(option);
    }).toList();
  }

  void sendMessage(String text) {
    ChatService.sendParentMessage(text);
    controller.clear();
    scrollToBottom();
  }

  void sendOption(String text) {
    Navigator.pop(context);

    setState(() {
      selectedOptions.add(text);
    });

    ChatService.sendParentMessage(text, isOption: true);
    scrollToBottom();
  }

  void showFAQOptions() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
      ),
      builder: (context) {
        final options = availableQuickOptions;

        return Padding(
          padding: const EdgeInsets.fromLTRB(16, 14, 16, 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 45,
                height: 5,
                margin: const EdgeInsets.only(bottom: 15),
                decoration: BoxDecoration(
                  color: Colors.black26,
                  borderRadius: BorderRadius.circular(20),
                ),
              ),
              const Row(
                children: [
                  Icon(
                    Icons.chat_bubble_outline,
                    color: Color.fromARGB(255, 128, 36, 36),
                  ),
                  SizedBox(width: 10),
                  Text(
                    "Frequently Asked Questions",
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 17,
                      color: Colors.black,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 15),

              if (options.isEmpty)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(15),
                  decoration: BoxDecoration(
                    color: const Color.fromARGB(255, 245, 245, 245),
                    borderRadius: BorderRadius.circular(15),
                  ),
                  child: const Text(
                    "You already selected all FAQ choices.",
                    style: TextStyle(
                      color: Colors.black54,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                )
              else
                ...options.map((option) {
                  return GestureDetector(
                    onTap: () => sendOption(option),
                    child: Container(
                      margin: const EdgeInsets.only(bottom: 10),
                      padding: const EdgeInsets.symmetric(
                        vertical: 13,
                        horizontal: 15,
                      ),
                      decoration: BoxDecoration(
                        color: const Color.fromARGB(255, 245, 245, 245),
                        borderRadius: BorderRadius.circular(15),
                        border: Border.all(
                          color: const Color.fromARGB(255, 128, 36, 36),
                          width: 0.8,
                        ),
                      ),
                      child: Row(
                        children: [
                          const Icon(
                            Icons.help_outline,
                            color: Color.fromARGB(255, 128, 36, 36),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              option,
                              style: const TextStyle(
                                color: Colors.black,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                          const Icon(
                            Icons.arrow_forward_ios,
                            size: 15,
                            color: Colors.black54,
                          ),
                        ],
                      ),
                    ),
                  );
                }),
            ],
          ),
        );
      },
    );
  }

  void showAttachmentOptions() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return Wrap(
          children: [
            ListTile(
              leading: const Icon(Icons.attach_file),
              title: const Text("Attach a File"),
              onTap: () {
                Navigator.pop(context);
                ChatService.sendAttachmentMessage(
                  "📎 Parent attached a file for excuse letter.",
                );
                scrollToBottom();
              },
            ),
            ListTile(
              leading: const Icon(Icons.image),
              title: const Text("Select a Photo"),
              onTap: () {
                Navigator.pop(context);
                ChatService.sendAttachmentMessage(
                  "🖼️ Parent selected a photo as proof.",
                );
                scrollToBottom();
              },
            ),
          ],
        );
      },
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

  Widget buildMessage(Map<String, dynamic> msg) {
    return Align(
      alignment: msg["isBot"] ? Alignment.centerLeft : Alignment.centerRight,
      child: Container(
        constraints: const BoxConstraints(maxWidth: 280),
        margin: const EdgeInsets.symmetric(vertical: 5),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(15),
        ),
        child: Text(
          msg["text"],
          style: const TextStyle(color: Colors.black),
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
            icon: const Icon(Icons.attach_file, color: Colors.black),
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
            icon: const Icon(Icons.send, color: Colors.black),
            onPressed: () => sendMessage(controller.text),
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
      color: const Color.fromARGB(255, 128, 36, 36),
      child: Stack(
        children: [
          Column(
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
                      padding: const EdgeInsets.all(12),
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
          Positioned(
            right: 14,
            bottom: 90,
            child: FloatingActionButton(
              mini: true,
              backgroundColor: Colors.white,
              elevation: 5,
              onPressed: showFAQOptions,
              child: const Icon(
                Icons.question_answer,
                color: Color.fromARGB(255, 128, 36, 36),
              ),
            ),
          ),
        ],
      ),
    );
  }
}