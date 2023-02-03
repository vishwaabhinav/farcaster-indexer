create table "public"."likes" (
    "hash" text not null,
    "reactor_id" bigint,
    "reactor_user_name" text,
    "reactor_display_name" text,
    "timestamp" timestamp with time zone,
    "cast_hash" text
);


CREATE UNIQUE INDEX likes_pkey ON public.likes USING btree (hash);

alter table "public"."likes" add constraint "likes_pkey" PRIMARY KEY using index "likes_pkey";


