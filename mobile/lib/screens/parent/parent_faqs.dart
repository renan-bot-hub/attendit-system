import 'package:flutter/material.dart';

class ParentFaqs extends StatelessWidget {
  const ParentFaqs({super.key});

  static const Color maroon = Color.fromARGB(255, 128, 36, 36);

  final List<Map<String, String>> schedules = const [
    {
      "title": "Morning Check",
      "details": "Attendance checking starts from 7:00 AM to 8:00 AM.",
    },
    {
      "title": "Late Monitoring",
      "details": "Students arriving after 8:00 AM may be marked as Late.",
    },
    {
      "title": "Afternoon Review",
      "details":
          "Teachers may review and update attendance records after class.",
    },
    {
      "title": "Parent Update",
      "details":
          "Parents may view updated attendance records after teacher confirmation.",
    },
  ];

  final List<String> rules = const [
    "The teacher or adviser is responsible for recording attendance.",
    "Students must be checked during the official attendance monitoring time.",
    "Parents should not message first unless the teacher starts the conversation.",
    "Excuse letters or proof of absence should be submitted only when requested or when the teacher opens the conversation.",
    "Attendance status should be reviewed carefully before marking a student as Present, Late, or Absent.",
    "Incorrect attendance records should be reported to the teacher for verification.",
  ];

  final List<Map<String, String>> faqs = const [
    {
      "question": "What is AttendIT?",
      "answer":
          "AttendIT is an attendance monitoring system that helps parents monitor their child’s attendance records and receive important school updates.",
    },
    {
      "question": "Can parents message the teacher first?",
      "answer":
          "No. Parents are not allowed to send the first message. The teacher or adviser must start the conversation first.",
    },
    {
      "question": "Why is the message tab locked?",
      "answer":
          "The message tab is locked to avoid unnecessary disturbance during class hours. It will unlock once the teacher starts the conversation.",
    },
    {
      "question": "When can parents reply?",
      "answer":
          "Parents can reply only after the teacher sends the first message or reopens the conversation.",
    },
    {
      "question": "Can I submit an excuse letter?",
      "answer":
          "Yes. Once the teacher opens the conversation, you may attach an excuse letter or photo proof.",
    },
    {
      "question": "What does Present mean?",
      "answer":
          "Present means the student attended class and was recorded during attendance checking.",
    },
    {
      "question": "What does Late mean?",
      "answer":
          "Late means the student arrived after the official attendance checking time.",
    },
    {
      "question": "What does Absent mean?",
      "answer":
          "Absent means the student was not recorded during the attendance checking period.",
    },
  ];

  Widget sectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(top: 18, bottom: 12),
      child: Text(
        title,
        style: const TextStyle(
          color: maroon,
          fontSize: 22,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Widget scheduleCard(Map<String, String> item) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(
          color: maroon.withOpacity(0.20),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 12,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            item["title"]!,
            style: const TextStyle(
              color: maroon,
              fontSize: 17,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            item["details"]!,
            style: const TextStyle(
              color: Colors.black87,
              fontSize: 15,
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }

  Widget ruleCard(String rule, int index) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 20),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF7F7),
        borderRadius: BorderRadius.circular(22),
        border: Border.all(
          color: maroon.withOpacity(0.18),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            "${index + 1}",
            style: const TextStyle(
              color: maroon,
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(width: 22),
          Expanded(
            child: Text(
              rule,
              style: const TextStyle(
                color: Colors.black87,
                fontSize: 15,
                height: 1.5,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget faqCard(Map<String, String> faq) {
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(
          color: maroon.withOpacity(0.20),
        ),
      ),
      child: ExpansionTile(
        tilePadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 5),
        childrenPadding: const EdgeInsets.fromLTRB(20, 0, 20, 18),
        iconColor: maroon,
        collapsedIconColor: maroon,
        title: Text(
          faq["question"]!,
          style: const TextStyle(
            color: maroon,
            fontSize: 15,
            fontWeight: FontWeight.bold,
          ),
        ),
        children: [
          Align(
            alignment: Alignment.centerLeft,
            child: Text(
              faq["answer"]!,
              style: const TextStyle(
                color: Colors.black87,
                fontSize: 14,
                height: 1.5,
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(4, 12, 4, 24),
      children: [
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: maroon,
            borderRadius: BorderRadius.circular(24),
          ),
          child: const Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                "What are FAQS?",
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                ),
              ),
              SizedBox(height: 8),
              Text(
                "FAQS means Frequently Asked Questions. This page contains common questions and simple answers to help parents understand how AttendIT works, how attendance is monitored, and how messaging with teachers is handled.",
                style: TextStyle(
                  color: Colors.white70,
                  fontSize: 14,
                  height: 1.5,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 8),
        sectionTitle("Attendance Monitoring Schedule"),
        ...schedules.map((item) => scheduleCard(item)),
        sectionTitle("Attendance Rules"),
        ...rules.asMap().entries.map(
              (entry) => ruleCard(entry.value, entry.key),
            ),
        sectionTitle("Frequently Asked Questions"),
        ...faqs.map((faq) => faqCard(faq)),
      ],
    );
  }
}
