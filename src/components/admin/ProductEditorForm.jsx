import { useEffect, useState } from 'react';
import { catalogGroups, getSubgroupsForGroup } from '../../data/catalogTaxonomy';

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Nao foi possivel carregar a imagem.'));
    reader.readAsDataURL(file);
  });
}

export function ProductEditorForm({ initialProduct, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    stock: 0,
    imageUrl: '',
    groupSlug: 'gravata',
    subgroupSlug: 'lisa',
    active: true,
  });
  const [uploadMessage, setUploadMessage] = useState('');

  useEffect(() => {
    setForm({
      name: initialProduct?.name || '',
      description: initialProduct?.description || '',
      price: initialProduct ? (initialProduct.priceCents / 100).toFixed(2).replace('.', ',') : '',
      stock: initialProduct?.stock ?? 0,
      imageUrl: initialProduct?.imageUrl || '',
      groupSlug: initialProduct?.groupSlug || 'gravata',
      subgroupSlug: initialProduct?.subgroupSlug || 'lisa',
      active: initialProduct?.active ?? true,
    });
  }, [initialProduct]);

  const subgroupOptions = getSubgroupsForGroup(form.groupSlug);

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadMessage('Gerando preview local...');
    try {
      const imageUrl = await readFileAsDataUrl(file);
      setForm((currentForm) => ({ ...currentForm, imageUrl }));
      setUploadMessage('Imagem carregada com sucesso.');
    } catch (error) {
      setUploadMessage(error.message);
    }
  };

  return (
    <section className="panel">
      <div className="page-head">
        <h1>{initialProduct ? 'Editar produto' : 'Novo produto'}</h1>
        <p className="small">Cole a secure_url do Cloudinary ou use uma imagem local apenas para preview rapido.</p>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(form);
        }}
      >
        <div className="taxonomy-box">
          <div className="page-head">
            <h2>Classificacao do produto</h2>
            <p className="small">Escolha o grupo principal e a subcategoria antes de salvar. Isso organiza o catalogo e os filtros da loja.</p>
          </div>

          <div className="form-grid">
            <div>
              <label htmlFor="product-group">Grupo principal</label>
              <select
                id="product-group"
                value={form.groupSlug}
                onChange={(event) =>
                  setForm({
                    ...form,
                    groupSlug: event.target.value,
                    subgroupSlug: getSubgroupsForGroup(event.target.value)[0]?.slug || '',
                  })
                }
                required
              >
                {catalogGroups.map((group) => (
                  <option key={group.slug} value={group.slug}>
                    {group.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="product-subgroup">Subcategoria</label>
              <select
                id="product-subgroup"
                value={form.subgroupSlug}
                onChange={(event) => setForm({ ...form, subgroupSlug: event.target.value })}
                required
                disabled={!form.groupSlug}
              >
                {subgroupOptions.map((subgroup) => (
                  <option key={subgroup.slug} value={subgroup.slug}>
                    {subgroup.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="form-grid">
          <div>
            <label htmlFor="product-name">Nome</label>
            <input
              id="product-name"
              type="text"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              required
            />
          </div>

          <div>
            <label htmlFor="product-price">Preco (R$)</label>
            <input
              id="product-price"
              type="text"
              value={form.price}
              onChange={(event) => setForm({ ...form, price: event.target.value })}
              required
            />
          </div>

          <div>
            <label htmlFor="product-stock">Estoque</label>
            <input
              id="product-stock"
              type="number"
              min="0"
              value={form.stock}
              onChange={(event) => setForm({ ...form, stock: event.target.value })}
              required
            />
          </div>

          <div>
            <label htmlFor="product-active">Produto ativo?</label>
            <select
              id="product-active"
              value={form.active ? 'true' : 'false'}
              onChange={(event) => setForm({ ...form, active: event.target.value === 'true' })}
            >
              <option value="true">Sim</option>
              <option value="false">Nao</option>
            </select>
          </div>
        </div>

        <label htmlFor="product-description">Descricao</label>
        <textarea
          id="product-description"
          value={form.description}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
        />

        <label htmlFor="product-image-url">URL da imagem</label>
        <input
          id="product-image-url"
          type="url"
          value={form.imageUrl}
          onChange={(event) => setForm({ ...form, imageUrl: event.target.value })}
        />

        <div className="upload-box">
          <div>
            <label htmlFor="product-image-file">Imagem local para preview</label>
            <input id="product-image-file" type="file" accept="image/*" onChange={handleFileChange} />
          </div>
          <span className="small">{uploadMessage}</span>
        </div>

        {form.imageUrl ? (
          <div className="image-preview">
            <img src={form.imageUrl} alt="Preview do produto" />
          </div>
        ) : null}

        <div className="form-actions">
          <button type="submit">{initialProduct ? 'Salvar alteracoes' : 'Criar produto'}</button>
          <button className="btn secondary" type="button" onClick={onCancel}>
            Cancelar
          </button>
        </div>
      </form>
    </section>
  );
}
