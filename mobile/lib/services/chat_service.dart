import 'package:flutter/foundation.dart';

enum ChatSender {
  parent,
  bot,
  teacher,
  system,
}

enum ChatIntent {
  faq,
  attendance,
  schedule,
  absence,
  adviser,
  attachment,
  unknown,
}

class ChatMessage {
  final String text;
  final bool isBot;
  final bool isOption;
  final bool isTeacher;
  final ChatSender sender;
  final ChatIntent intent;
  final DateTime createdAt;

  ChatMessage({
    required this.text,
    required this.isBot,
    this.isOption = false,
    this.isTeacher = false,
    this.sender = ChatSender.bot,
    this.intent = ChatIntent.unknown,
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();

  Map<String, dynamic> toMap() {
    return {
      "text": text,
      "isBot": isBot,
      "isOption": isOption,
      "isTeacher": isTeacher,
      "sender": sender.name,
      "intent": intent.name,
      "createdAt": createdAt,
    };
  }
}

class FaqItem {
  final String key;
  final String title;
  final String answer;
  final ChatIntent intent;
  final List<String> keywords;

  const FaqItem({
    required this.key,
    required this.title,
    required this.answer,
    required this.intent,
    required this.keywords,
  });
}

class ChatService {
  static final ValueNotifier<List<ChatMessage>> messages =
      ValueNotifier<List<ChatMessage>>([
    ChatMessage(
      text:
          "Hi! I'm AttendBot, your virtual assistant. I can answer common attendance questions while the teacher is unavailable.",
      isBot: true,
      sender: ChatSender.bot,
      intent: ChatIntent.faq,
    ),
  ]);

  static const String followUpMessage =
      "\n\nWould you like help with another concern? You may select another FAQ or send a message directly.";

  static final List<FaqItem> faqItems = [
    const FaqItem(
      key: "get started",
      title: "Get Started",
      intent: ChatIntent.faq,
      keywords: [
        "get started",
        "start",
        "help",
        "how to use",
        "attend-it",
        "attendit",
      ],
      answer:
          "Welcome to Attend-IT! This system helps parents monitor attendance records, communicate with teachers, justify absences, and receive attendance notifications.",
    ),
    const FaqItem(
      key: "homeroom schedule",
      title: "Homeroom Schedule",
      intent: ChatIntent.schedule,
      keywords: [
        "homeroom",
        "schedule",
        "class schedule",
        "time",
        "what time",
      ],
      answer:
          "Homeroom classes are conducted Monday to Friday at 7:30 AM. Students are encouraged to complete attendance check-in before class starts. For sudden schedule changes, the adviser or school office may provide an update.",
    ),
    const FaqItem(
      key: "rules for monitoring",
      title: "Rules for Monitoring",
      intent: ChatIntent.attendance,
      keywords: [
        "rules",
        "monitoring",
        "policy",
        "attendance rules",
        "guidelines",
      ],
      answer:
          "Parents may monitor attendance records, absences, and late arrivals through the system. Attendance data is updated after teacher verification. Notifications are generated when attendance concerns are detected.",
    ),
    const FaqItem(
      key: "talk to the adviser",
      title: "Talk To The Adviser",
      intent: ChatIntent.adviser,
      keywords: [
        "adviser",
        "teacher",
        "talk",
        "message teacher",
        "contact adviser",
      ],
      answer:
          "Your adviser may currently be unavailable. You may leave a message here and it will be visible to the teacher once they access the system. For urgent concerns, please contact the school office directly.",
    ),
    const FaqItem(
      key: "justify absence",
      title: "Justify Absence",
      intent: ChatIntent.absence,
      keywords: [
        "justify absence",
        "absence",
        "absent",
        "excuse",
        "excuse letter",
        "medical certificate",
      ],
      answer:
          "To justify an absence, please submit an excuse letter or supporting document using the attachment button. Once submitted, the adviser will review and validate your request.",
    ),
    const FaqItem(
      key: "view attendance record",
      title: "View Attendance Record",
      intent: ChatIntent.attendance,
      keywords: [
        "view attendance",
        "attendance record",
        "record",
        "analytics",
        "present",
        "late",
        "absent",
      ],
      answer:
          "Attendance records can be viewed through the Attendance and Analytics sections of the application. You can monitor Present, Late, and Absent records, including attendance trends and possible risk levels.",
    ),
  ];

  static Map<String, String> get faqs {
    return {
      for (final item in faqItems) item.key: item.answer,
    };
  }

  static void sendParentMessage(String text, {bool isOption = false}) {
    final cleanText = text.trim();
    if (cleanText.isEmpty) return;

    final intent = detectIntent(cleanText);

    messages.value = [
      ...messages.value,
      ChatMessage(
        text: isOption ? "Parent selected: $cleanText" : cleanText,
        isBot: false,
        isOption: isOption,
        sender: ChatSender.parent,
        intent: intent,
      ),
    ];

    Future.delayed(const Duration(milliseconds: 500), () {
      messages.value = [
        ...messages.value,
        ChatMessage(
          text: getBotReply(cleanText),
          isBot: true,
          sender: ChatSender.bot,
          intent: intent,
        ),
      ];
    });
  }

  static void sendTeacherMessage(String text) {
    final cleanText = text.trim();
    if (cleanText.isEmpty) return;

    messages.value = [
      ...messages.value,
      ChatMessage(
        text: "Teacher: $cleanText",
        isBot: true,
        isTeacher: true,
        sender: ChatSender.teacher,
        intent: detectIntent(cleanText),
      ),
    ];
  }

  static void sendAttachmentMessage(String text) {
    final cleanText = text.trim();

    messages.value = [
      ...messages.value,
      ChatMessage(
        text: cleanText,
        isBot: false,
        sender: ChatSender.parent,
        intent: ChatIntent.attachment,
      ),
    ];

    Future.delayed(const Duration(milliseconds: 500), () {
      messages.value = [
        ...messages.value,
        ChatMessage(
          text:
              "Your attachment has been recorded. The teacher can review it when available. Please make sure the document clearly shows the student name, date of absence, and reason.",
          isBot: true,
          sender: ChatSender.bot,
          intent: ChatIntent.attachment,
        ),
      ];
    });
  }

  static ChatIntent detectIntent(String input) {
    final text = input.toLowerCase().trim();

    final matchedFaq = findMatchingFaq(text);
    if (matchedFaq != null) return matchedFaq.intent;

    if (_containsAny(text, ["absent", "absence", "excuse", "medical"])) {
      return ChatIntent.absence;
    }

    if (_containsAny(text, ["schedule", "time", "homeroom", "class"])) {
      return ChatIntent.schedule;
    }

    if (_containsAny(text, ["teacher", "adviser", "contact", "message"])) {
      return ChatIntent.adviser;
    }

    if (_containsAny(text, ["attendance", "present", "late", "record"])) {
      return ChatIntent.attendance;
    }

    return ChatIntent.unknown;
  }

  static FaqItem? findMatchingFaq(String input) {
    final text = input.toLowerCase().trim();

    for (final faq in faqItems) {
      if (text == faq.key || text == faq.title.toLowerCase()) {
        return faq;
      }

      for (final keyword in faq.keywords) {
        if (text.contains(keyword.toLowerCase())) {
          return faq;
        }
      }
    }

    return null;
  }

  static String getBotReply(String input) {
    final matchedFaq = findMatchingFaq(input);

    if (matchedFaq != null) {
      return "${matchedFaq.answer}$followUpMessage";
    }

    final intent = detectIntent(input);

    switch (intent) {
      case ChatIntent.absence:
        return "It looks like your concern is about an absence. Please submit an excuse letter or supporting document using the attachment button. The adviser will review it when available.$followUpMessage";

      case ChatIntent.schedule:
        return "It looks like your concern is about the schedule. Homeroom is usually Monday to Friday at 7:30 AM. For changes, please wait for adviser or school office announcements.$followUpMessage";

      case ChatIntent.adviser:
        return "Your message for the adviser has been recorded. The teacher can review this conversation when they become available. For urgent matters, please contact the school office.$followUpMessage";

      case ChatIntent.attendance:
        return "It looks like your concern is about attendance records. You may check the Attendance or Analytics section to view Present, Late, and Absent records.$followUpMessage";

      case ChatIntent.attachment:
        return "Your attachment has been recorded and will be available for teacher review.$followUpMessage";

      case ChatIntent.faq:
        return "I can help you with attendance records, homeroom schedule, monitoring rules, adviser communication, and absence justification.$followUpMessage";

      case ChatIntent.unknown:
        return "Your message has been recorded. If the teacher is unavailable, AttendBot will keep this conversation for review. You may also select one of the FAQ options for faster assistance.";
    }
  }

  static bool _containsAny(String text, List<String> keywords) {
    return keywords.any((keyword) => text.contains(keyword.toLowerCase()));
  }

  static void clearConversation() {
    messages.value = [
      ChatMessage(
        text:
            "Hi! I'm AttendBot, your virtual assistant. I can answer common attendance questions while the teacher is unavailable.",
        isBot: true,
        sender: ChatSender.bot,
        intent: ChatIntent.faq,
      ),
    ];
  }
}