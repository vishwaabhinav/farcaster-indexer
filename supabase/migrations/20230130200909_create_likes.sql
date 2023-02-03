alter table "public"."likes" add constraint "likes_cast_hash_fkey" FOREIGN KEY (cast_hash) REFERENCES casts(hash) not valid;

alter table "public"."likes" validate constraint "likes_cast_hash_fkey";

alter table "public"."likes" add constraint "likes_reactor_id_fkey" FOREIGN KEY (reactor_id) REFERENCES profile(id) not valid;

alter table "public"."likes" validate constraint "likes_reactor_id_fkey";


