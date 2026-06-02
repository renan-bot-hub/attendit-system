import 'dart:async';
import 'package:flutter/foundation.dart';

class ChatMessage {
  final String text;
  final String senderRole;
  final bool isTeacher;
  final bool isParent;
  final bool isAttendBot;
  final bool teacherOnly;
  final DateTime createdAt;

  ChatMessage({
    required this.text,
    required this.senderRole,
    this.isTeacher = false,
    this.isParent = false,
    this.isAttendBot = false,
    this.teacherOnly = false,
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();

  Map<String, dynamic> toMap() {
    return {
      "text": text,
      "senderRole": senderRole,
      "role": senderRole,
      "sender": senderRole,
      "isTeacher": isTeacher,
      "isParent": isParent,
      "isAttendBot": isAttendBot,
      "teacherOnly": teacherOnly,
      "createdAt": createdAt,
    };
  }
}

class ChatService {
  static final ValueNotifier<List<ChatMessage>> messages =
      ValueNotifier<List<ChatMessage>>([]);

  static Timer? _teacherResponseTimer;

  static bool isParentLocked = true;

  static const Duration teacherResponseLimit = Duration(hours: 1);

  static void sendTeacherMessage(String text) {
    final cleanText = text.trim();
    if (cleanText.isEmpty) return;

    _teacherResponseTimer?.cancel();
    isParentLocked = false;

    final updatedMessages = List<ChatMessage>.from(messages.value);

    updatedMessages.add(
      ChatMessage(
        text: cleanText,
        senderRole: "teacher",
        isTeacher: true,
      ),
    );

    messages.value = updatedMessages;
  }

  static void sendParentMessage(String text) {
    final cleanText = text.trim();
    if (cleanText.isEmpty || isParentLocked) return;

    final updatedMessages = List<ChatMessage>.from(messages.value);

    updatedMessages.add(
      ChatMessage(
        text: cleanText,
        senderRole: "parent",
        isParent: true,
      ),
    );

    messages.value = updatedMessages;
    _startTeacherResponseTimer();
  }

  static void sendAttachmentMessage(String text) {
    final cleanText = text.trim();
    if (cleanText.isEmpty || isParentLocked) return;

    final updatedMessages = List<ChatMessage>.from(messages.value);

    updatedMessages.add(
      ChatMessage(
        text: cleanText,
        senderRole: "parent",
        isParent: true,
      ),
    );

    messages.value = updatedMessages;
    _startTeacherResponseTimer();
  }

  static void _startTeacherResponseTimer() {
    _teacherResponseTimer?.cancel();

    _teacherResponseTimer = Timer(teacherResponseLimit, () {
      lockParentConversationByAttendBot();
    });
  }

  static void lockParentConversationByAttendBot() {
    isParentLocked = true;

    final updatedMessages = List<ChatMessage>.from(messages.value);

    updatedMessages.add(
      ChatMessage(
        text:
            "AttendBot Notice: The conversation was locked because the teacher did not respond within 1 hour. Please review the parent message when available. Once you reply, the parent can respond again.",
        senderRole: "attendbot",
        isAttendBot: true,
        teacherOnly: true,
      ),
    );

    messages.value = updatedMessages;
  }

  static void clearConversation() {
    _teacherResponseTimer?.cancel();
    isParentLocked = true;
    messages.value = [];
  }
}