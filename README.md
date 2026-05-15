```
머리카락 실시간으로 빠지는 중
머리카락만 빠지면 다행인듯
```
## Getting Started
```
npm run dev
python -m http.server 8000
Open [http://localhost:3000]
Open [http://localhost:8000]
```
## Getting push to git
```
git remote show origin
```
```
수정 취소           git restore --staged app/login/page.tsx
전체 업로드         git add .
다른 브랜치에 업로드 git push origin [branch name]
공통
git commit -m "수정 내용"
git push
```
## Compare with git
git status
```
수정 사항 있을 때   modified: app/page.tsx
git보다 뒤쳐질 때 [git full]    >Your branch is behind 'origin/main'
git보다 앞서갈 때 [git push]    >Your branch is ahead of 'origin/main'
```
## List to do
```
처음 페이지랑 각각의 게시물 목록에 보이는 내용이랑 동기화 안되어 있음
게시물 목록에 좋아요 버튼 동기화 안됨
게시물 내용에 익명 , 닉네임, 이름 색깔 이상함
게시물 올린 시간 이상함
작성자 익명 > 익명
작성자 닉네임 > 닉네임
구매하기 버튼 활성화 안되어 있음
입찰하기에 숫자 이외의 글자도 입력이 되어버림
입찰 단위 생각해보자 1원 추가는 에바임
강의평게시판에 글 올려도 글이 안올라가짐
추천 랭킹은 의미가 없어서 새로 만들어야함
관리자 페이지 추가 > 관리자 계정 만들기 > 신고 내역 볼수 있게 하기
인원 관리 페이지 추가
```
