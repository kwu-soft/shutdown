#!/bin/bash
echo "🛠️  [1/2] 프로젝트 내부 가상 환경 세팅을 시작합니다..."

# 1. 백엔드 가상환경 설정 및 패키지 설치
echo "🐍 백엔드(Python 3) 독립 가상환경 구축 중..."
cd backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
deactivate
cd ..

# 2. 프론트엔드 패키지 설치 (최상위 폴더가 프론트엔드인 구조 반영)
echo "📦 프론트엔드(Node.js) 모듈 설치 중..."
npm install

echo "========================================================="
echo "🚀  [2/2] 서버 백그라운드 가동을 시작합니다..."
echo "========================================================="

# 3. 도커 MySQL DB 가동 (기존에 켜진 게 있으면 중복 충돌 방지를 위해 지우고 켭니다)
echo "🐳 Docker MySQL 데이터베이스 컨테이너 구동 중..."
sudo docker rm -f mysql > /dev/null 2>&1
sudo docker run --name mysql -e MYSQL_ROOT_PASSWORD=mysql_password -e MYSQL_DATABASE=shutdown_db -p 3306:3306 -d mysql:8.0

# 4. 백엔드(FastAPI) 백그라운드 실행
echo "⚙️  백엔드 API 서버 구동 중 (Port: 8010)..."
cd backend
source venv/bin/activate
python3 -m uvicorn app.main:app --port 8010 &
cd ..

# 5. 프론트엔드(Next.js) 백그라운드 실행
echo "🎨 프론트엔드 웹 서버 구동 중..."
npm run dev &

echo "========================================================="
echo "✅ 모든 서버가 백그라운드에서 정상 구동되었습니다."
echo "🌐 브라우저를 열고 http://localhost:3000 으로 접속하세요!"
echo "========================================================="