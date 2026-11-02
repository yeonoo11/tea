// 페이지 맨 위 제목: 명조 제목 + 짧은 설명, 오른쪽(또는 왼쪽)에 수채화 한 점
// art 는 이미지 주소(public/images/dadam/…). 장식이라 alt 는 비워요.
export default function PageHeader({ title, subtitle, art, artSide = 'left', children }) {
  return (
    <header className={`dd-pagehead art-${artSide}`}>
      {art && <img className="art" src={art} alt="" />}
      <div className="txt">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
        {children}
      </div>
    </header>
  )
}
