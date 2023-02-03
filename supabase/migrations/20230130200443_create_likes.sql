alter table "public"."likes" drop constraint "likes_pkey";

drop index if exists "public"."likes_pkey";

drop table "public"."likes";


