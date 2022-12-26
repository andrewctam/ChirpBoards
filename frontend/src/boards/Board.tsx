import { useState } from "react"
import Layout from "../Layout"
import Comment from "./Comment"
import ReplyBox from "./ReplyBox"
import Vote from "./Vote"

interface BoardProps {
    id: string
}

function Board(props: BoardProps) {
    const [author, setAuthor] = useState("Admin")
    const [date, setDate] = useState("Today")
    const [text, setText] = useState("Lorem")

    const [comments, setComments] = useState<JSX.Element[]>([
        <Comment id = "0" />,
        <Comment id = "abc" />

    ])
    const [replying, setReplying] = useState(false)

    return (
        <Layout>
            <div className = "mx-auto w-11/12 md:w-4/5 lg:w-3/4">

                <div className = "w-full my-12 p-8 border border-black rounded-xl bg-sky-100 relative break-all">

                    <a href = "./profile" className = "absolute -top-8 left-2 bg-white text-black rounded-xl p-2 border border-black">
                        {author}
                        <div className = "text-xs"> {date} </div>
                    </a>

                    {text}

                    {replying ?
                    <ReplyBox 
                        cancel = {() => {setReplying(false)}}
                        id = {props.id}
                    /> 
                    : 
                    <button className = "bg-gray-200 text-black border border-black/20 rounded shadow-md text-xs absolute -bottom-3 right-4 px-2 py-1" 
                    onClick = {() => {setReplying(true)}}>
                            Reply
                        </button>
                    }

                    <Vote />

                </div>
                
                
                {comments.length > 0 ? 
                <div className = "w-full border-l border-l-gray-200">
                    {comments}
                </div>
             : null}

            </div>
        </Layout>
    )


}


export default Board