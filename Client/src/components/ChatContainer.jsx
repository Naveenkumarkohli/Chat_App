import { useContext, useEffect, useRef, useState } from "react"
import toast from "react-hot-toast"
import assets, { messagesDummyData } from "../assets/assets"
import { formatMessageTime } from "../Lib/utils"
import { ChatContext } from "../../context/chatContext"
import { AuthContext } from "../../context/AuthContext"


const ChatContainer = () => {
  const {messages,SelectedUser,setSelectedUser, sendMessage, getMessages } = useContext(ChatContext)
  const {authUser, onlineUsers } = useContext(AuthContext)

    const scrollEnd = useRef()
    const messagesContainerRef = useRef(null)
      
    const [input,setInput] = useState('');
    const [uploading, setUploading] = useState(false);

    // handle sendng messsage
    const handleSendMessage = async (e)=>{
      e.preventDefault();
      if(input.trim() === "") return null;
      await sendMessage({text: input.trim()});
    setInput("")
    }

    // compress image before sending to speed up uploads
    const compressImage = (file, maxWidth = 1280, maxHeight = 1280, quality = 0.7) => new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();
      reader.onload = () => {
        img.onload = () => {
          let { width, height } = img;
          const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(width * ratio);
          canvas.height = Math.round(height * ratio);
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          // Prefer WebP if supported, fallback to JPEG
          const mime = file.type.includes('png') ? 'image/jpeg' : (file.type || 'image/webp');
          const dataUrl = canvas.toDataURL(mime, quality);
          resolve(dataUrl);
        };
        img.onerror = reject;
        img.src = reader.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    // handle sending an image (with compression)
    const handleSendImage = async (e)=>{
      const file = e.target.files && e.target.files[0];
      if(!file || !file.type.startsWith("image/")){
        toast.error("Select a valid image file");
        return;
      }
      try {
        setUploading(true);
        const dataUrl = await compressImage(file);
        await sendMessage({ image: dataUrl });
        e.target.value = "";
      } catch (err) {
        toast.error("Failed to process image");
      } finally {
        setUploading(false);
      }
    }

    useEffect(()=>{
      if(SelectedUser){
        getMessages(SelectedUser._id)
      }
    },[SelectedUser])

    // Robust auto-scroll to bottom when messages change
    useEffect(()=>{
        const el = messagesContainerRef.current;
        if (el) {
          // Use requestAnimationFrame to wait for DOM updates (e.g., images)
          requestAnimationFrame(() => {
            el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
          });
        }
    },[messages])

  return SelectedUser ? (
    <div className="h-full overflow-scroll relative backdrop-blur-lg">

        {/*...............header...................*/}
      <div className="flex items-center gap-3 py-3 mx-4 border-b border-stone-500">
        <img src={SelectedUser.profilePic || assets.avatar_icon} alt="" className="w-8 rounded-full" />
        <p className="flex-1 text-lg text-white flex items-center gap-2">
            {SelectedUser.fullName}
            { onlineUsers.includes(SelectedUser._id) && (
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
            )}
        </p>
        <img  onClick={()=> setSelectedUser(null)} src={assets.arrow_icon} alt="" className="md:hidden max-m-7" />
        <img src={assets.help_icon} alt=""  className="max-md:hidden max-w-5"/>

      </div>
      {/*..............chat area............. */}
      <div ref={messagesContainerRef} className="flex flex-col h-[calc(100%-120px)] overflow-y-scroll p-3 pb-6">
        {messages.map((msg,index)=>
        <div key={index} className={`flex items-end gap-2 justify-end ${msg.senderId !== authUser._id && 'flex-row-reverse'}`}>
            {msg.image ? (
                <img src={msg.image} alt="" className="max-w-[230px] border border-gray-700 rounded-lg overflow-hidden mb-8" />
            ):(
                <p className={`p-2 max-w-[200px] md:text-sm font-light rounded-lg mb-8 break-all bg-violet-500/30 text-white ${msg.senderId === authUser._id ? 'rounded-br-none' : 'rounded-bl-none'}`}>{msg.text}</p>
            )}
            <div className="text-center text-xs">
                <img src={msg.senderId === authUser._id ? authUser?.profilePic || assets.avatar_icon : SelectedUser?.profilePic || assets.avatar_icon} alt=""  className="w-7 rounded-full"/>
                <p className="text-gray-500">{formatMessageTime(msg.createdAt)}</p>
            </div>

        </div>
        )}
        <div ref={scrollEnd}></div>
        

      </div>
      {/*......................... Bottom chat input area................... */}
    <div className="absolute bottom-0 left-0 right-0 flex items-center gap-3 p-3">
      <div className="flex-1 flex items-center bg-gray-100/10 px-3 rounded-full">
      <input onChange={(e)=> setInput(e.target.value)} value={input} onKeyDown={(e)=>e.key ==="Enter" ? handleSendMessage(e) : null} type="text" placeholder="Send a message" 
      className="flex-1 text-sm p-3 border-none rounded-lg outline-none text-white placeholder-gray-400 bg-transparent" disabled={uploading}/>
    <input onChange={handleSendImage} type="file" id="image" accept="image/*" hidden disabled={uploading} />
    <label htmlFor="image" className={uploading ? "opacity-50 cursor-not-allowed" : undefined}>
      <img src={assets.gallery_icon} alt="Upload" className={`w-5 mr-2 ${uploading ? 'cursor-not-allowed' : 'cursor-pointer'}`} />
    </label>
  </div>

  <img onClick={!uploading ? handleSendMessage : undefined} src={assets.send_button} alt="Send" className={`w-7 ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`} title={uploading ? 'Uploading image...' : 'Send'} />
</div>
    </div>
  ):(
    <div className="flex flex-col items-center justify-center gap-2 text-gray-500 bg-white/10 max-md:hidden">
        <img src={assets.logo_icon} className="max-w-16" alt="" />
        <p className="text-lg font-medium text-white">Chat Anytime,Anywhere</p>
    </div>
  )
}

export default ChatContainer
