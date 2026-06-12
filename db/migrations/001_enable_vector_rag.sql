-- Enable pgvector-backed RAG without resetting existing WasteNot data.

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS rag_document_embeddings (
    embedding_id TEXT PRIMARY KEY,
    doc_id TEXT NOT NULL,
    embedding_model TEXT NOT NULL,
    embedding_dimensions INTEGER NOT NULL DEFAULT 1536,
    text_hash TEXT NOT NULL,
    embedding vector(1536),
    token_estimate INTEGER,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS llm_invocation_logs (
    invocation_id TEXT PRIMARY KEY,
    feature_name TEXT NOT NULL,
    model TEXT,
    embedding_model TEXT,
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    total_tokens INTEGER,
    status TEXT,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rag_document_embeddings_doc_id
ON rag_document_embeddings(doc_id);

CREATE INDEX IF NOT EXISTS idx_rag_document_embeddings_model
ON rag_document_embeddings(embedding_model);

CREATE INDEX IF NOT EXISTS idx_rag_document_embeddings_text_hash
ON rag_document_embeddings(text_hash);

CREATE INDEX IF NOT EXISTS idx_rag_document_embeddings_created_at
ON rag_document_embeddings(created_at);

DO $$
BEGIN
    CREATE INDEX IF NOT EXISTS idx_rag_document_embeddings_vector
    ON rag_document_embeddings USING hnsw (embedding vector_cosine_ops);
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Skipping HNSW vector index creation: %', SQLERRM;
END $$;
