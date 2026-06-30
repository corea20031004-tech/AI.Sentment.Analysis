# PRD - 감성 분석 AI 서비스 제품 요구사항

## 제품 개요

사용자가 입력한 문장을 AI가 분석하여 감정 상태를 알려주는 웹 서비스.

## 사용자 흐름

1.  사용자가 텍스트 입력
2.  분석 요청 버튼 클릭
3.  Backend가 OpenAI 요청
4.  결과 반환
5.  화면에 결과 표시

## 핵심 기능

### 텍스트 입력

-   여러 문장 입력 가능
-   빈 값 분석 방지

### AI 감성 분석

OpenAI를 이용하여 다음 결과 제공: - 긍정 - 부정 - 중립

추가 제공: - 신뢰도(%) - 분석 이유 - 오류 메시지

## 기술 스택

Frontend: - HTML - CSS - JavaScript

Backend: - Node.js

AI: - OpenAI API

Database: - Supabase

Deployment: - Vercel

## 제한사항

-   AI 결과는 참고용 정보
-   민감한 개인정보 입력 금지 안내 필요
-   API Key 보호 필요

## 완료 조건

모든 핵심 기능이 정상 동작하고 배포 가능한 상태.
