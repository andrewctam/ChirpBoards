import { useEffect, useState } from "react"
import ReplyBox from "./ReplyBox"
import Vote from "./Vote"

interface CommentProps {
    id: string
}

function Comment(props: CommentProps) {
    const [author, setAuthor] = useState("Admin")
    const [date, setDate] = useState("Today")
    const [text, setText] = useState("Lorem")
    
    const [replies, setReplies] = useState<JSX.Element[]>([])
    const [showReplies, setShowReplies] = useState(false)
    const [replying, setReplying] = useState(false)
    
    useEffect(() => {
        if (props.id === "0")
            setReplies([ <Comment id = "1" />])
        if (props.id === "1")
            setReplies([ <Comment id = "2" />])
        if (props.id === "2")
            setReplies([ <Comment id = "3" />])
        if (props.id === "3")
            setReplies([ <Comment id = "4" />])
        if (props.id === "4")
            setReplies([ <Comment id = "5" />])
        if (props.id === "5")
            setReplies([ <Comment id = "6" />, <Comment id = "7as" />, <Comment id = "8asd" />])
        if (props.id === "6")
            setReplies([ <Comment id = "7" />])
        if (props.id === "7")
            setReplies([ <Comment id = "8" />, <Comment id = "9" />])


    }, []);

    return (
        <div className = "w-[95%] ml-[5%]">
            <div className = "my-6 px-8 py-4 border border-black rounded-lg bg-white relative break-all">
                <div className = "block mb-3">
                    <a href = "./profile">
                        {author}
                    </a>
                    
                    <div className = "text-xs inline">
                        {` ${date}`} 
                    </div>
                </div>
                
                {text}

                {replying ? 
                <ReplyBox 
                    cancel = {() => {setReplying(false)}}
                    id = {props.id}
                /> : null}

                <div className = "absolute -bottom-3 right-6">
                    {replies.length > 0 ?
                    <button className = "bg-gray-200 text-black border border-black/20 rounded shadow-md text-xs mr-2 px-2 py-1" 
                        onClick = {() => {setShowReplies(!showReplies)}}>

                        {`${showReplies ? "Hide " : "Show "} Replies`}
                    </button> : null}


                    {!replying ? 
                    <button className = "bg-gray-200 text-black border border-black/20 rounded shadow-md text-xs px-2 py-1" 
                        onClick = {() => {setReplying(true)}}>
                        Reply
                    </button> : null}
                   
                </div>

                <Vote />
            </div>

            {replies.length > 0 && showReplies ? 
                <div className = "w-full border-l border-l-white">
                    {replies}
                </div>
             : null}
        </div>
    )

}

export default Comment;