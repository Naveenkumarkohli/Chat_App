import { useState } from "react";
import ChatContainer from "../components/ChatContainer";
import RightSidebar from "../components/RightSidebar";
import Sidebar from "../components/Sidebar";
import { ChatContext } from "../../context/chatContext";
import { useContext } from "react";


const HomePage = () => {
    const {SelectedUser} = useContext(ChatContext)
  return (
    <div className='border w-full h-screen sm:px-[15%] sm:py-[5%]'>
     <div className={`backdrop-blur-xl border-2 border-gray-600 rounded-2xl overflow-hidden h-[100%] grid grid-cols-1 relative ${SelectedUser ? 'md:grid-cols-[1fr_1.5fr_1fr] xl:grid-cols-[1fr_2fr_1fr]' : 'md:grid-cols-2'}`}> 
        <Sidebar />
        <ChatContainer />
        <RightSidebar />
    </div>   
    </div>
  )
}

export default HomePage;
