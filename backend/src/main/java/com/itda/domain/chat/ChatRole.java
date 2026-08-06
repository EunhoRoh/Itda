package com.itda.domain.chat;

/** 대화방 참여자 역할. ASSISTANT는 AI 동석 도우미 — 사용자가 이 역할로 보낼 수 없다. */
public enum ChatRole {
    SENDER,
    RECIPIENT,
    ASSISTANT
}
