"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

import {
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  BarChart3,
  CalendarDays,
  Bot,
  ChartCandlestick,
  BookMarked,
  Users,
  Settings,
  Crown,
  ShieldCheck,
} from "lucide-react";


const menus = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Academy",
    href: "/academy",
    icon: GraduationCap,
  },
  {
    title: "PDF Library",
    href: "/library",
    icon: BookOpen,
  },
  {
    title: "Market Research",
    href: "/research",
    icon: BarChart3,
  },
  {
    title: "Economic Calendar",
    href: "/calendar",
    icon: CalendarDays,
  },
  {
    title: "AI Scanner",
    href: "/scanner",
    icon: Bot,
  },
  {
    title: "Premium Signal",
    href: "/signal",
    icon: ChartCandlestick,
  },
  {
    title: "Trading Journal",
    href: "/journal",
    icon: BookMarked,
  },
  {
    title: "Community",
    href: "/community",
    icon: Users,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
];


export default function Sidebar(){

  const pathname = usePathname();

  const [isAdmin,setIsAdmin] = useState(false);
  const [checked,setChecked] = useState(false);


  useEffect(()=>{

    const checkAdmin = async()=>{

      try{

        const user = auth.currentUser;


        if(!user){
          setChecked(true);
          return;
        }


        const ref = doc(
          db,
          "users",
          user.uid
        );


        const snap = await getDoc(ref);


        if(
          snap.exists() &&
          snap.data()?.isAdmin === true
        ){

          setIsAdmin(true);

        }


      }catch(err){

        console.log(
          "ADMIN CHECK ERROR",
          err
        );

      }


      setChecked(true);

    };


    checkAdmin();


  },[]);



return (

<aside
className="
fixed
left-0
top-0
h-screen
w-72
border-r
border-white/10
bg-[#050b16]/95
backdrop-blur-xl
flex
flex-col
z-50
"
>


{/* LOGO */}

<div className="px-6 py-8 border-b border-white/10 flex items-center gap-4">

  <div
    className="
      w-14
      h-14
      rounded-2xl
      bg-gradient-to-br
      from-cyan-400
      via-blue-500
      to-cyan-700
      flex
      items-center
      justify-center
      shadow-[0_0_30px_rgba(0,200,255,0.35)]
    "
  >
    <span className="text-3xl font-black text-white tracking-wide">
      N
    </span>
  </div>

  <div>

    <h1 className="text-xl font-bold tracking-[0.25em] text-white">
      NOXVEIL
    </h1>

    <p className="text-xs tracking-[0.5em] text-cyan-400">
      ARCANUM
    </p>

  </div>

</div>

{/* MENU */}

<nav
className="
flex-1
overflow-y-auto
px-4
py-6
"
>


{
menus.map((menu)=>{

const Icon = menu.icon;


const active =
pathname === menu.href ||
pathname.startsWith(menu.href+"/");


return (

<Link
key={menu.href}
href={menu.href}
className={`
mb-2
flex
items-center
gap-3
rounded-2xl
px-4
py-3
transition-all
duration-300

${
active

?

"border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 shadow-[0_0_20px_rgba(0,200,255,0.08)]"

:

"text-zinc-400 hover:bg-white/5 hover:text-white"

}

`}
>

<Icon size={20}/>

<span className="font-medium">
{menu.title}
</span>

</Link>

)

})

}




{/* ADMIN ONLY */}

{
checked && isAdmin && (

<Link

href="/admin"

className={`
mt-4
flex
items-center
gap-3
rounded-2xl
px-4
py-3
border
transition-all


${
pathname.startsWith("/admin")

?

"border-red-500/40 bg-red-500/10 text-red-400"

:

"border-red-500/20 text-zinc-400 hover:bg-red-500/10 hover:text-red-400"

}

`}

>


<ShieldCheck size={20}/>


<span className="font-semibold">
ADMIN PANEL
</span>


</Link>

)

}


</nav>





{/* MEMBERSHIP CARD */}

<div className="p-5">


<div
className="
rounded-2xl
border
border-cyan-500/20
bg-gradient-to-br
from-cyan-500/10
to-blue-500/10
p-5
"
>


<div className="flex items-center gap-3">


<Crown
className="text-cyan-400"
/>


<div>

<p className="text-xs text-zinc-400">
Membership
</p>


<p className="font-bold text-cyan-400">
EXPERT
</p>


</div>


</div>


</div>


</div>


</aside>


)

}