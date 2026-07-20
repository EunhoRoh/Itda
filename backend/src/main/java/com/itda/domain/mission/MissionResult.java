package com.itda.domain.mission;

public enum MissionResult {
    REPLIED,   // 답장 왔어요
    NO_REPLY,  // 아직 답 없어요 (미션은 열린 채 유지)
    NOT_SENT   // 못 보냈어요 (격려 후 종료)
}
