#!/bin/bash
echo "========================================================="
echo "⚠️  조교님 PC에 프로젝트 구동용 필수 도구를 설치합니다."
echo "⚠️  (대상: Docker, Node.js, npm, Python3 가상환경)"
echo "========================================================="
read -p "설치를 진행하시겠습니까? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo "🔄 패키지 목록 업데이트 중..."
    sudo apt update -y

    echo "🐳 Docker 설치 및 엔진 가동 중..."
    sudo apt install docker.io -y
    sudo systemctl start docker
    sudo systemctl enable docker

    echo "🐍 Python3 가상환경(venv) 도구 설치 중..."
    sudo apt install python3-venv python3-pip -y

    echo "📦 Node.js 및 npm 설치 중..."
    sudo apt install nodejs npm -y

    echo "========================================================="
    echo "✅ 필수 도구 설치 완료! 이제 ./2_start.sh 를 실행하세요."
    echo "========================================================="
else
    echo "❌ 설치가 취소되었습니다."
fi