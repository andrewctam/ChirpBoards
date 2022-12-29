import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { PostChirp } from "../App"
import Layout from "../Layout"
import Comment from "./Comment"
import ReplyBox from "./ReplyBox"
import Vote from "./Vote"

export interface Post extends PostChirp {
    commentCount: number
    score: number
}

function Board() {
    const [mainPost, setMainPost] = useState<Post | null>(null)

    const [comments, setComments] = useState<JSX.Element[]>([])
    const [pageNum, setPageNum] = useState(0);
    const [replying, setReplying] = useState(false)

    const params = useParams();
    const navigate = useNavigate();
    
    useEffect( () => {
        if (params && params.id) {
            fetchPost(params.id);
        }
    }, [] )

    const fetchPost = async (postId: string) => {
        const url = process.env.NODE_ENV !== "production" ? process.env.REACT_APP_DEV_URL : process.env.REACT_APP_PROD_URL
        const query =
        `query {    
            post(id: "${postId}") {
                author {
                    username
                    displayName
                }
                text
                isComment
                postDate
                score
                commentCount
                comments(first:0, offset:5) {
                    id
                    text
                    commentCount
                    postDate
                    score
                    author {
                        username
                        displayName
                    }
                }
            }
        }`

        const response = await fetch(url ?? '', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({query})
        }).then(res => res.json())
        console.log(response)

        const info = response.data.post;
        if (!info || info.isComment)
            navigate("/")

        setPageNum(1);

        setMainPost({
            id: postId,
            text: info.text,
            postDate: info.postDate,
            authorUsername: info.author.username,
            authorDisplayName: info.author.displayName,
            commentCount: info.commentCount,
            score: info.score,

        })

        setComments(info.comments.map((comment: any) => {
            return <Comment
                key = {comment.id}
                id = {comment.id}
                text = {comment.text}
                postDate = {comment.postDate}
                authorUsername = {info.author.username}
                authorDisplayName = {info.author.displayName}
                commentCount = {comment.commentCount}
                score = {info.score}
            />
        }))
    }

    const loadMoreComments = async () => {
        if (!mainPost)
            return;

        const url = process.env.NODE_ENV !== "production" ? process.env.REACT_APP_DEV_URL : process.env.REACT_APP_PROD_URL
        const query =
        `query {    
            post(id: "${mainPost.id}") {
                comments(first:${pageNum}, offset:5) {
                    id
                    text
                    commentCount
                    postDate
                    score
                    author {
                        username
                        displayName
                    }
                }
            }
        }`

        
        const response = await fetch(url ?? '', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({query})
        }).then(res => res.json())
        
        console.log(response)
        
        const info = response.data.post;
        if (!info || info.isComment)
            navigate("/");

        setPageNum(pageNum + 1)

        setComments(comments.concat(
            info.comments.map((comment: any) => {
                return <Comment
                    key = {comment.id}
                    id = {comment.id}
                    text = {comment.text}
                    postDate = {comment.postDate}
                    authorUsername = {comment.author.username}
                    authorDisplayName = {comment.author.displayName}
                    commentCount = {comment.commentCount}
                    score = {comment.score}
                />
            }))
        )
    }



    return (
        <Layout>
            {mainPost ? 
            <div className = "mx-auto w-11/12 md:w-4/5 lg:w-3/4">

                <div className = "w-full mt-12 mb-6 p-8 border border-black rounded-xl bg-sky-100 relative break-all">

                    <a href = "./profile" className = "absolute -top-8 left-2 bg-white text-black rounded-xl p-2 border border-black">
                        {mainPost.authorUsername}
                        <div className = "text-xs"> {mainPost.postDate} </div>
                    </a>

                    {mainPost.text}
                    <Vote postId = {mainPost.id} score = {mainPost.score}/>

                    {replying ?
                    <ReplyBox postId = {mainPost.id} close = {() => {setReplying(false)}} addReply = {(reply) => setComments([reply, ...comments]) } /> 
                    : 
                    <button className = "bg-gray-200 text-black border border-black/20 rounded shadow-md text-xs absolute -bottom-3 right-6 px-2 py-1" 
                        onClick = {() => {setReplying(true)}}>
                            Reply
                    </button>
                    }
                </div>
                
                
                <div className = "w-full border-l mb-10 border-l-gray-200">
                    {comments}

                    {comments.length < mainPost.commentCount ?
                        <p onClick = {loadMoreComments} className = "cursor-pointer ml-[5%] text-sky-100">Load more comments</p>
                    : null}
                </div>                

            </div> : null}
        </Layout>
    )


}


export default Board