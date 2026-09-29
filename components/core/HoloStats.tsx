"use client"

const stats = [
  {
    title:"XAUUSD",
    value:"LIVE"
  },
  {
    title:"AI CORE",
    value:"ONLINE"
  },
  {
    title:"LIQUIDITY",
    value:"ACTIVE"
  }
]

export default function HoloStats(){

  return (
    <div className="
      mt-10
      grid
      gap-3
      md:grid-cols-3
    ">

      {stats.map((item)=>(

        <div
          key={item.title}
          className="
          rounded-xl
          border
          border-cyan-400/20
          bg-cyan-400/5
          p-4
          text-center
          backdrop-blur-xl
          "
        >

          <p className="
          text-xs
          text-zinc-500
          ">
            {item.title}
          </p>


          <p className="
          mt-2
          text-sm
          font-bold
          text-cyan-400
          ">
            {item.value}
          </p>

        </div>

      ))}

    </div>
  )
}