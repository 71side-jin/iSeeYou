# 1. Backend (Port: 8000)

## 1.1 PostgreSQL 설치
-   PostgreSQL 15 이상은 대체로 동작 가능하지만, 본 프로젝트는 18.3 환경에서 개발 및 테스트했습니다.

## 1.2 DB 생성
pgAdmin4 실행 후:\
Servers → PostgreSQL → Databases → 우클릭 → Create → Database

## 1.3 .env 파일 생성
 1.3.1. backend에서 .env.example 복사해서 .env파일 생성\
 1.3.2. []로 감싸진 부분을 수정해줍니다.

## 1.4 가상환경 세팅 (Windows)
가상환경명 isyVenv로 통일 권장\
isyVenv가 아닌 다른 이름 쓸 경우 .gitignore의 .env 윗줄에 [가상환경명]/ 추가해주세요.\
\
backend에서:\
python -m venv [가상환경명]\
[가상환경명]\Scripts\activate <-가상환경 키는 명령어\
pip install -r requirements.txt\
alembic upgrade head

## 1.5 실행
backend에서 가상환경 킨 상태에서:\
uvicorn app.main:app --reload

------------------------------------------------------------------------

# 2. Frontend

## 2.1 Node.js 설치

## 2.2 관리자 페이지 (Port: 5174)
frontend\admin에서:\
npm install\
npm run dev

## 2.3 사용자 페이지 (Port: 5173)
frontend\user에서:\
npm install\
npm run dev

------------------------------------------------------------------------

# 기술 스택

Frontend: Vite + React\
Backend: FastAPI\
Database: PostgreSQL\
ORM: SQLAlchemy\
Migration: Alembic