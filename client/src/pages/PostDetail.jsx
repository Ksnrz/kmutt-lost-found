
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiRequest } from '../api';
import BackButton from '../components/BackButton';
import Card from '../components/Card';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import './PostDetail.css';

function PostDetail() {
  const navigate = useNavigate();
  const { postId } = useParams();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const handleCancelPost = async () => {
    const confirmed = window.confirm(
      'คุณต้องการยกเลิกประกาศนี้ใช่หรือไม่?'
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      setError('');

      await apiRequest(`/posts/${postId}/cancel`, {
        method: 'PATCH',
      });

      setPost((prev) => ({
        ...prev,
        post_status: 'CANCELLED',
      }));

      alert('ยกเลิกประกาศสำเร็จ!');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        setError('');

        const data = await apiRequest(`/posts/${postId}`);
        console.log('POST DETAIL:', data.post);
        setPost(data.post);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId]);

  const formatDate = (date) => {
    if (!date) return '-';

    return new Date(date).toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="container">
        กำลังโหลดรายละเอียดโพสต์...
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="container">
        <BackButton text="กลับไปรายการประกาศ" />
        <p style={{ color: 'red' }}>
          {error || 'ไม่พบประกาศนี้'}
        </p>
      </div>
    );
  }

  const postStatus = String(post.post_status || '')
    .trim()
    .toUpperCase();

  const isOpen = postStatus === 'OPEN';

  return (
    <div className="container">
      <BackButton text="กลับไปรายการประกาศ" />

      <div className="form-layout">
        <div className="form-left">
          <h1>{post.title}</h1>

          <StatusBadge
            status={postStatus.toLowerCase() || 'open'}
          />

          {post.images?.length > 0 ? (
            <>
              <img
                src={`http://localhost:3000${post.images[0].item_image_url}`}
                alt={post.title}
                style={{
                  width: '100%',
                  maxHeight: '350px',
                  objectFit: 'contain',
                  borderRadius: '12px',
                  marginBottom: '20px',
                }}
              />

              <div className="flex-image">
                {post.images.slice(1).map((image) => (
                  <img
                    key={image.item_image_id}
                    src={`http://localhost:3000${image.item_image_url}`}
                    alt={post.title}
                    style={{
                      width: '100px',
                      height: '100px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                    }}
                  />
                ))}
              </div>
            </>
          ) : (
            <p>ไม่มีรูปภาพประกอบ</p>
          )}

          <Card>
            <h2>{post.title}</h2>
            <p>{post.description}</p>
            <p>
              สถานที่พบ: {post.building_name || '-'} |
              วันที่: {formatDate(post.event_date)}
            </p>
          </Card>
        </div>

        <div className="form-right">
          <p className="Date">
            โพสต์เมื่อ {formatDate(post.created_at)}
          </p>

          <Card>
            <h2>ข้อมูลการรับของ</h2>

            <p>
              สถานะการเก็บ:{' '}
              {post.custody_type === 'DEPOSITED'
                ? 'ฝากไว้'
                : post.custody_type === 'SELF_KEPT'
                  ? 'ผู้พบเก็บไว้เอง'
                  : 'ไม่มีข้อมูล'}
            </p>

            <br />

            <p>ช่องทางติดต่อ</p>
            <h3>{post.contact_text || '-'}</h3>

            {isOpen ? (
              <>
                <div className="pos-but">
                  <Button
                    onClick={() =>
                      navigate(`/posts/${postId}/edit`)
                    }
                  >
                    แก้ไขโพสต์
                  </Button>

                  <Button onClick={handleCancelPost}>
                    ยกเลิกประกาศ
                  </Button>
                </div>

                <div className="pos-but">
                  <Button
                    onClick={() =>
                      navigate(`/posts/${postId}/claim`)
                    }
                  >
                    นี่อาจเป็นของฉัน
                  </Button>
                </div>

                <p className="comment">
                  หากเป็นสิ่งของของคุณส่งคำขอ
                </p>
                <p className="comment">
                  พร้อมรายละเอียดเฉพาะเพื่อยืนยัน
                </p>
              </>
            ) : (
              <p>ประกาศนี้ถูกยกเลิกแล้ว ไม่สามารถดำเนินการต่อได้</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

export default PostDetail;
